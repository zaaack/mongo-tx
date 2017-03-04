import ModelWrapper from './model-wrapper'
import { CommitError, RollbackError, RetryableError, LockedError } from './errors'
import { sleep, debug, randomStr } from './utils'

const defaults = {
  txModelName: '__tx_manager',
  createModel: null,
  createLock: null,
  txTimeout: 0,
  commitRetry: 3,
  commitInterval: 300,
  rollbackRetry: 3,
  rollbackInterval: 300,
}

let _txModel = null

class TxManager {
  constructor(nameOrTx, options) {
    if (typeof nameOrTx === 'object' && nameOrTx._id) {
      this.tx = nameOrTx
      this.name = nameOrTx._id
    } else if (typeof nameOrTx === 'string') {
      this.name = nameOrTx
    } else {
      throw new Error('Illegal parameter nameOrTx:', nameOrTx)
    }
    this.options = Object.assign({}, defaults, options)
    let { txTimeout, createModel, createLock, txModelName } = this.options
    // if (txTimeout <= 0) { // TODO: timeout ?
    //   txTimeout = Infinity
    // }
    if (!_txModel) {
      _txModel = createModel(txModelName)
    }
    this.txModel = _txModel
    this.txLock = createLock('transaction:' + this.name)
    this.models = []
  }

  wrap(model) {
    const { createModel } = this.options
    const modelInterface = createModel(model)
    const wrappedModel = new ModelWrapper(modelInterface, Object.assign({
      txModel: this.txModel,
      tx: this.tx,
    }, this.options))
    this.models.push(wrappedModel)
    return wrappedModel
  }

  async updateTxState(state = 'running') { // running, committing, rollingback
    this.tx = await this.txModel.findOneAndUpdate({ _id: this.tx._id }, {
      $set: { state },
    }, {
      returnOriginal: false,
    })
  }

  async start() {
    await this.txLock.lock()
    debug('tx:', this.name, 'start')
    const { timeout } = this.options
    this.tx = await this.txModel.create({
      _id: this.name,
      name: this.name,
      // expire: new Date(Date.now() + timeout),
      snapshots: {},
      state: 'running',
    })
  }

  async run (fn) {
    await this.start()
    try {
      await fn(this)
      try {
        await this.commit(this.options.retry)
      } catch (e) {
        console.error(new CommitError('tx: ' + this.tx.name, e))
      }
    } catch (e) {
      try {
        await this.rollback(this.options.retry)
      } catch (e) {
        throw new RollbackError('tx: ' + this.tx.name, e)
      }
      throw e
    }
  }

  async retry(fn, retry = 3, retryInterval = 300) {
    for (let i = 0; i < retry; i++) {
      try {
        debug('tx:', this.name, 'retry', fn.name, i)
        await fn()
      } catch (e) {
        if (e instanceof RetryableError) {
          console.error(e)
          await sleep(retryInterval)
          continue
        }
        throw e
      }
      return
    }
  }

  async commit() {
    debug('tx:', this.name, 'committing')
    await this.updateTxState('committing')
    const { commitRetry, commitRetryInterval } = this.options
    await this.retry(async () => {
      for (let wrapedModel of this.models) {
        await wrapedModel.commit()
      }
    }, commitRetry, commitRetryInterval)
    debug('tx:', this.name, 'finish')
    await this.finish()
  }

  async rollback() {
    debug('tx:', this.name, 'rollingback')
    await this.updateTxState('rollingback')
    const { rollbackRetry, rollbackRetryInterval } = this.options
    await this.retry(async () => {
      for (let wrapedModel of this.models) {
        await wrapedModel.rollback()
      }
    }, rollbackRetry, rollbackRetryInterval)
    debug('tx:', this.name, 'finish')
    await this.finish()
  }

  async finish() {
    // await this.updateTxState('finished')
    await this.txModel.findOneAndRemove({ _id: this.name })
    await this.txLock.release()
  }
}

/**
 * fix transactions after a crash, rollback all rollingback, commit all committing transactions.
 * @return
 */
export async function fixCrash() {
  let { createModel, createLock, txModelName } = this.options
  _txModel = _txModel || createModel(txModelName)
  const txModel = _txModel
  const txLock = createLock('MongoTx:fixCrash')
  await txLock.lock()
  const txDocs = txModel.find()
  for (let txDoc in txDocs) {
    const txManager = new TxManager(txDoc, this.options)
    switch (txDoc.state) {
      case 'running':
      case 'rollingback':
        await txManager.rollback()
        break
      case 'committing':
        await txManager.commit()
        break
      default:
    }
  }
  await txLock.release()
}

export default function MongoTx(options) {
  function createTx(name, fn) {
    const txMgr = new TxManager(name, options)
    if (fn) {
      return txMgr.run(fn)
    }
    return txMgr
  }
  createTx.options = options
  createTx.fixCrash = fixCrash
  return createTx
}

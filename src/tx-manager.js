import ModelWrapper from './model-wrapper'
import { CommitError, RollbackError, RetryableError, LockedError } from './errors'
import { sleep, debug, randomStr } from './utils'

const defaults = {
  txColName: 'tx_manager',
  createModel: null,
  createLock: null,
  txTimeout: 0,
  commitRetry: 3,
  commitInterval: 300,
  rollbackRetry: 3,
  rollbackInterval: 300,
  lockTxName: false,
}

let _txModel = null

class TxManager {
  constructor(nameOrTx, options) {
    let lockNames = []
    if (typeof nameOrTx === 'object' && nameOrTx._id) {
      this.tx = nameOrTx
      this.name = nameOrTx.name
      lockNames = nameOrTx.locks
    } else if (typeof nameOrTx === 'string') {
      this.name = nameOrTx
      lockNames.push(this.name)
    } else if (Array.isArray(nameOrTx)) {
      this.name = nameOrTx.join(':')
      lockNames = lockNames.concat(nameOrTx)
    } else {
      throw new Error('Illegal parameter nameOrTx:', nameOrTx)
    }
    this.options = options = Object.assign({}, defaults, options)
    let { txTimeout, createModel, createLock, txColName, lockTxName } = this.options
    // if (txTimeout <= 0) { // TODO: timeout ?
    //   txTimeout = Infinity
    // }
    if (!_txModel) {
      _txModel = createModel(txColName)
    }
    this.txModel = _txModel
    this.txLocks = []
    if (lockTxName) {
      this.txLocks = lockNames.map(lockName => createLock('transaction:' + lockName))
    }
    this.models = []
    this.lockNames = lockNames
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
    await Promise.all(this.txLocks.map(tl => tl.lock()))

    debug('tx:', this.name, 'start')
    const { timeout } = this.options
    this.tx = await this.txModel.create({
      name: this.name,
      // expire: new Date(Date.now() + timeout),
      snapshots: {},
      locks: this.lockNames,
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
        throw new CommitError('tx: ' + this.tx.name, e)
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
        if (i < retry - 1) {
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
    await this.txModel.findOneAndRemove({ _id: this.tx._id })
    await Promise.all(this.txLocks.map(tl => tl.release()))
  }
}

/**
 * fix transactions after a crash, rollback all rollingback, commit all committing transactions.
 * @return
 */
async function fixCrash() {
  let { createModel, createLock, txColName } = this.options
  _txModel = _txModel || createModel(txColName)
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
  async function runTx(name, fn, _options) {
    if (typeof _options === 'function') {
      let tmp = _options
      _options = fn
      fn = tmp
    }
    options = Object.assign({}, options, _options)
    options.createModel = await options.createModel
    options.createLock = await options.createLock
    const txMgr = new TxManager(name, options)
    if (fn) {
      return txMgr.run(fn)
    }
    return txMgr
  }
  Object.assign(runTx, {
    options,
    fixCrash,
    createDocLock: (...args) => ModelWrapper.createDocLock(...args, options),
  })
  return runTx
}

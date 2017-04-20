import { ObjectId } from 'mongodb'
import { debug } from './utils'

export default class ModelWrapper {

  constructor(model, options) {
    this.model = model
    this.options = options
    const { tx, createLock, txModel, txTimeout } = options
    this.tx = tx
    this.txModel = txModel
    this.createLock = (id) => this.constructor.createDocLock(model.name(), id, options)
    this.locks = {}
  }

  static createDocLock(colName, docId, options) {
    const { createLock } = options
    return createLock(`document:${colName}_${docId}`)
  }

  name() {
    return this.model.name()
  }

  _snapId(docId) {
    return `snapshots.${this.name()}_${docId}`
  }

  async snapshotAndLock(doc, action = 'update') {
    const txId = this.tx._id
    const snap = this.tx.snapshots[`${this.name()}_${doc._id}`]
    // only create lock once for non-lock snapshot
    if (snap && snap.action !== 'query') {
      return
    }
    // lock
    const id = doc._id.toString()
    if (!(id in this.locks)) {
      const lock = this.createLock(id.toString())
      await lock.lock()
      this.locks[id] = lock
    }
    // take snap
    this.tx = await this.txModel.findOneAndUpdate({ _id: txId }, {
      $set: {
        [this._snapId(doc._id)]: {
          tx_id: txId,
          action,
          doc,
        },
      },
    }, {
      returnOriginal: false,
    })
    debug('this.tx', this.tx)
  }

  async findOne(match, ...args) {
    let _id
    if (match._id) {
      _id = match._id
    } else {
      const doc = await this.model.findOne(match, ...args)
      if (!doc) return doc
      _id = doc._id
    }
    await this.lockForQuery(_id)
    return this.model.findOne({ _id })
  }

  async find(match, ...args) {
    let docs = await this.model.find(match, ...args)
    docs = docs.filter(f => f)
    await Promise.all(docs.map(
      doc => this.lockForQuery(doc._id)))
    return this.model.find({ _id: { $in: docs.map(doc => doc._id) } })
  }
  /**
   * Deprecate, using lockForQuery instead
   * @param  {ObjectId}  id
   * @return {Promise}
   */
  async lock(id) {
    return this.lockForQuery(id)
  }

  async lockForQuery(id) {
    return this.snapshotAndLock({ _id: id }, 'query')
  }

  async release(id) {
    const lock = this.createLock(id.toString())
    await lock.release()
  }

  async create(doc, ...args) {
    doc._id = ObjectId()
    await this.snapshotAndLock(doc, 'create')
    doc = await this.model.create(doc, ...args)
    return doc
  }

  async findOneAndUpdate(match, updateDocument, options) {
    const doc = await this.model.findOne(match)
    if (!doc) return doc
    await this.snapshotAndLock(doc, 'update')
    return await this.model.findOneAndUpdate(match, updateDocument, options)
  }

  async findOneAndRemove(match, options) {
    const doc = await this.model.findOne(match)
    if (!doc) return doc
    await this.snapshotAndLock(doc, 'remove')
    await this.model.findOneAndRemove(match, options)
    return doc
  }

  async removeSnap(docId) {
    const ret = await this.txModel.findOneAndUpdate({ _id: this.tx._id }, {
      $unset: {
        [this._snapId(docId)]: '',
      },
    }, {
      returnOriginal: false,
    })
    this.tx = ret || this.tx
  }

  async commit() {
    const { snapshots: snaps } = this.tx
    for (let snapId in snaps) {
      const { doc } = snaps[snapId]
      await this.removeSnap(doc._id)
      await this.release(doc._id)
    }
  }

  async rollback() {
    const { snapshots: snaps } = this.tx
    for (let snapId in snaps) {
      const { action, doc } = snaps[snapId]
      try {
        switch (action) {
          case 'create':
            await this.model.findOneAndRemove({_id: doc._id})
            break
          case 'update':
            await this.model.findOneAndUpdate({_id: doc._id}, doc)
            break
          case 'remove':
            await this.model.create(doc)
            break
          case 'query': // just removeSnap and release
          default:
        }
        await this.removeSnap(doc._id)
        await this.release(doc._id)
      } catch (e) {
        console.error(`Module [${this.model.name}] rollback error in transaction: ${this.tx.name} (_id: ${this.tx._id})`)
        throw e
      }
    }
  }
}

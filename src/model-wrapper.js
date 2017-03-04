import { ObjectId } from 'mongodb'
import { debug } from './utils'

export default class ModelWrapper {

  constructor(model, options) {
    this.model = model
    this.options = options
    const { tx, createLock, txModel, txTimeout } = options
    this.tx = tx
    this.txModel = txModel
    this.createLock = (id) => createLock(`document:${model.name()}__${id}`, txTimeout)
    this.locks = {}
  }

  name() {
    return this.model.name()
  }

  _snapId(docId) {
    return `snapshots.${this.name()}_${docId}`
  }

  async snapshot(doc, action = 'update') {
    const txId = this.tx._id
    if (this.tx.snapshots[`${this.name()}.${doc.id}`]) {
      return
    }
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
  }

  async findOne(match) {
    return this.model.findOne(match)
  }

  async find(match) {
    return this.model.find(match)
  }

  async lock(id) {
    id = id.toString()
    if (!(id in this.locks)) {
      const lock = this.createLock(id.toString())
      await lock.lock()
      this.locks[id] = lock
    }
  }

  async release(id) {
    const lock = this.createLock(id.toString())
    await lock.release()
  }

  async create(doc) {
    doc._id = ObjectId()
    await this.lock(doc._id)
    await this.snapshot(doc, 'create')
    doc = await this.model.create(doc)
    return doc
  }

  async findOneAndUpdate(match, updateDocument, options) {
    const doc = await this.model.findOne(match)
    if (!doc) return doc
    await this.lock(doc._id)
    await this.snapshot(doc, 'update')
    return await this.model.findOneAndUpdate(match, updateDocument, options)
  }

  async findOneAndRemove(match, options) {
    const doc = await this.model.findOne(match)
    if (!doc) return doc
    await this.lock(doc._id)
    await this.snapshot(doc, 'remove')
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
      debug('remove snap', doc._id)
      await this.removeSnap(doc._id)
      debug('release', doc._id)
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
            const ret = await this.model.findOneAndRemove({_id: doc._id}, doc)
            debug('findOneAndRemove ret', ret)
            break
          case 'update':
            await this.model.findOneAndUpdate({_id: doc._id}, doc)
            break
          case 'remove':
            await this.model.create(doc)
            break
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

import fs from 'fs'
import pify from 'pify'
import path from 'path'
import result from 'lodash.result'
import { debug } from '../utils'

const toJson = m => (m && m.get())

export default ({
  opts = { // overwrite WriteConcern
    w: 1,
    wtimeout: 5000,
    j: 1,
  },
  db
} = {}) => {
  if (!db) {
    throw new Error('Parameter options.db shouldn\'t be null!')
  }
  return function createModel(collectionName) {
    return {
      name() {
        return collectionName
      },

      async getCol() {
        if (!this._col) {
          this._col = await db.collection(collectionName, opts)
        }
        return this._col
      },
      async create(doc) {
        const col = await this.getCol()
        const ret = await col.insertOne(doc)
        doc._id = ret.ops[0]._id
        return doc
      },

      async find(match) {
        const col = await this.getCol()
        return await col.find(match).toArray()
      },

      async index(field, options) {
        const col = await this.getCol()
        return col.createIndex(field, options)
      },

      async findOne(match) {
        const col = await this.getCol()
        return col.find(match).limit(1).next()
      },

      async findOneAndUpdate(match, updateDocument, options) {
        const col = await this.getCol()
        const results = await col.findOneAndUpdate(match, updateDocument, options)
        debug('results', results)
        if (results.ok) {
          return results.value
        } else {
          debug('results not ok', results)
        }
        return null
      },

      async findOneAndRemove(match, updateDocument, options) {
        const col = await this.getCol()
        const results = await col.findOneAndDelete(match, updateDocument, options)
        debug('findOneAndRemove results', results)
        if (results.ok) {
          return results.value
        }
        return null
      },
    }
  }
}

import fs from 'fs'
import pify from 'pify'
import path from 'path'
import mongorito, { Model } from 'mongorito'
import result from 'lodash.result'
import { debug } from '../utils'

const toJson = m => (m && m.get())

export default ({
  writeConcern = { // overwrite WriteConcern
    w: 1,
    wtimeout: 5000,
    j: 1,
  },
  db
} = {}) => {
  if (!db) {
    throw new Error('Parameter options.db shouldn\'t be null!')
  }
  return function createModel(MongoritoModel) {
    let collectionName
    let ParentModel = Model
    if (
      typeof MongoritoModel.collection === 'function' &&
      typeof MongoritoModel.collection() === 'string'
    ) {
      ParentModel = MongoritoModel
      collectionName = MongoritoModel.collection()
    } else {
      collectionName = MongoritoModel
    }
    MongoritoModel = class extends ParentModel {
      static collection() {
        return collectionName
      }

      static dbCollection() {
        return this.connection()
          .then(db => {
            const name = result(this, 'collection')
            return db.collection(name, writeConcern)
          })
      }
    }
    db.register(MongoritoModel)
    return {
      name() {
        return MongoritoModel.collection()
      },

      async create(doc) {
        const docModel = new MongoritoModel(doc)
        await docModel.create(doc)
        return toJson(docModel)
      },

      async find(match) {
        return MongoritoModel
          .find(match)
          .then(docs => docs.map(toJson))
      },

      async index(field, options) {
        return MongoritoModel.index(field, options)
      },

      async findOne(match) {
        return MongoritoModel.findOne(match).then(toJson)
      },

      async findOneAndUpdate(match, updateDocument, options) {
        const col = await MongoritoModel.dbCollection()
        const results = await col.findOneAndUpdate(match, updateDocument, options)
        if (results.ok) {
          return results.value
        }
      },

      async findOneAndRemove(match, options) {
        const col = await MongoritoModel.dbCollection()
        const results = await col.findOneAndDelete(match, options)
        if (results.ok) {
          return results.value
        }
      },
    }
  }
}

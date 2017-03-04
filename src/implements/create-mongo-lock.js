import fs from 'fs'
import pify from 'pify'
import path from 'path'
import { LockedError, LockedWaitTimeoutError } from '../errors'
import crypto from 'crypto'
import { randomStr } from '../utils'
import createMongoMQ from './create-mongo-mq'

const pFs = pify(fs)

function getTimeoutError(name, expire, e) {
  return new LockedWaitTimeoutError(
    `${name}(wait timeout: ${
      (new Date()).toISOString()} >= ${new Date(expire).toISOString()})`, e)
}

const queueMsgName = name => `${name}:release`

async function waitForRelease(queue, name, expire, e) {
  return new Promise((resolve, reject) => {
    const now = Date.now()
    let resolved = false
    setTimeout(() => {
      if (resolved) return
      resolved = true
      reject(getTimeoutError(name, expire, e))
    }, expire - now)
    queue.once(queueMsgName(name), () => {
      if (!resolved) {
        resolved = true
        resolve()
      }
    })
  })
}

export default ({
  db, collectionName = 'tx_locks',
  defaultTimeout = 30 * 1000,
  notDelete = false,
  writeConcern = {
    w: 1,
    wtimeout: 2000,
    j: 1,
  },
  queue = createMongoMQ({ databaseName: db.databaseName }),
  wait = false, // throws error when wait is false and is already locked
  maxWaitTime = 5000,
} = {}) => {
  if (!db) {
    throw new Error('Parameter options.db shouldn\'t be null!')
  }
  let col
  class Lock {
    constructor(name, { timeout = defaultTimeout, lockedMsg } = {}) {
      this.name = name
      this.timeout = timeout
      this.message = lockedMsg
    }

    async lock(start = Date.now()) {
      if (!col) {
        col = await db.collection(collectionName, writeConcern)
        await col.createIndex({ name: 1 }, { unique: true })
        await col.createIndex({ expire: 1 })
      }
      // clean expired
      const now = new Date()
      if (notDelete) {
        await col.update({
          name: this.name,
          expire: { $lt: now },
          expired: { $exists: false },
        }, {
          name: `${this.name}:${now.toISOString()}:${randomStr()}`,
          expired: now,
        })
      } else {
        await col.deleteOne({
          name: this.name,
          expire: { $lt: now },
        })
      }
      // try insert lock with unique key
      try {
        await col.insertOne({
          name: this.name,
          expire: new Date(Date.now() + this.timeout),
        })
      } catch (e) {
        if (e) {
          if (e.code === 11000) {
            e.stack = null // use out stack
            if (wait) {
              await waitForRelease(queue, this.name, start + maxWaitTime, e)
              await this.lock(start)
            } else {
              // there is currently a valid lock in the datastore
              throw new LockedError(this.name, e)
            }
          } else {
            // don't know what this error is
            throw e
          }
        }
      }
    }

    async release() {
      try {
        if (notDelete) {
          const now = new Date()
          await col.update({
            name: this.name,
          }, {
            name: `${this.name}:${now.toISOString()}:${randomStr()}`,
            released: now,
          })
        } else {
          await col.deleteOne({
            name: this.name,
          })
        }
        if (wait) {
          await queue.emit(queueMsgName(this.name), 1)
        }
        return true
      } catch (e) {
        console.warn('Release failed', e)
        return false
      }
    }
  }
  return (name, opts) => new Lock(name, opts)
}

import fs from 'fs'
import pify from 'pify'
import path from 'path'
import { LockedError, LockedWaitTimeoutError } from '../errors'
import crypto from 'crypto'
import { randomStr, debug, sleep } from '../utils'
import createMongoMQ from './create-mongo-mq'

const pFs = pify(fs)

function getTimeoutError(name, expire, e) {
  return new LockedWaitTimeoutError(
    `${name}(wait timeout: ${new Date(expire).toISOString()})`, e)
}

const queueMsgName = name => `${name}:release`

async function waitForRelease(queue, name, expire, e) {
  return new Promise((resolve, reject) => {
    const now = Date.now()
    let resolved = false
    const msgName = queueMsgName(name)
    setTimeout(() => {
      if (resolved) return
      resolved = true
      reject(getTimeoutError(name, expire, e))
    }, expire - now)

    queue.once(msgName, function listener(err, data) {
      if (err) {
        reject(err)
        return
      }
      if (data) {
        resolve()
      } else {
        queue.once(msgName, listener)
      }
    })
  })
}

let col
class Lock {
  constructor(name, options) {
    this.name = name
    this.options = options
  }

  async lock(start = Date.now()) {
    const {
      collectionName, writeConcern,
      db, notDelete, wait, queue,
      maxWaitTime, maxLockTime
    } = this.options
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
        expire: new Date(Date.now() + maxLockTime),
      })
    } catch (e) {
      if (e) {
        if (e.code === 11000) {
          e.stack = null // use out stack
          if (wait) {
            // await sleep(300)
            await waitForRelease(queue, this.name, start + maxWaitTime, e)
            debug('lock again')
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
    const {
      collectionName, writeConcern,
      db, notDelete, wait, queue,
      maxWaitTime
    } = this.options
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
        queue.emit(queueMsgName(this.name), 1)
      }
      return true
    } catch (e) {
      console.warn('Release failed', e)
      return false
    }
  }
}
const defaults = {
  db: null,
  collectionName: 'tx_locks',
  maxLockTime: 2 * 60 * 1000,
  notDelete: true,
  writeConcern: {
    w: 1,
    wtimeout: 2000,
    j: 1,
  },
  onError: err => console.error(err),
  queue: null,
  wait: false, // throws error when wait is false and is already locked
  maxWaitTime: 20 * 1000,
}
export default options => {
  if (!options.db) {
    throw new Error('Parameter options.db shouldn\'t be null!')
  }
  options = Object.assign({}, defaults, options)
  if (options.wait && !options.queue) {
    options.queue = createMongoMQ({ databaseName: options.db.databaseName })
  }
  return (name, opts) => new Lock(name, Object.assign({}, options, opts))
}

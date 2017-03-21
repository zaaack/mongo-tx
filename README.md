# mongo-tx
A flexible &amp; extensible mongodb transaction library.

[![Build Status](https://travis-ci.org/zaaack/mongo-tx.svg?branch=master)](https://travis-ci.org/zaaack/mongo-tx) [![npm](https://img.shields.io/npm/v/mongo-tx.svg)](https://www.npmjs.com/package/mongo-tx) [![npm](https://img.shields.io/npm/dm/mongo-tx.svg)](https://www.npmjs.com/package/mongo-tx)
## Install

`npm i --save mongo-tx`

or

`yarn add mongo-tx`

## How to

### Intro
When you create a transaction, this library will create a lock of the transaction name, and You need to use model wrappers to modify data during transactions, each model wrapper would create lock and snapshot before created/modified/removed one single document, after all operations of these documents in this transaction have succeeded, transaction manager will remove all snapshots and release all locks (committing). If error happend in this transaction, all changed documents will be replaced by snapshots and locks will also be released (rollingback).

### Lock
Built-in lock is implemented by mongo's unique key, and using [jdarling/MongoMQ](https://github.com/jdarling/MongoMQ) to create a waiting lock. You can create your own lock by redis, ssdb or other library.
> NOTICE: This kind of lock won't work like any relational database, you need to manually acquire a lock to make sure it is a synchronized operation. If you need to make sure "the locked document" in transaction is also locked in any other place, you'd better create a transaction for it, or acquire a document lock before modify it:
```js
const lock = runTx.createDocLock(colName: string, docId: ObjectId|string)
await lock.lock()
// do something
await lock.release()
```

### Fix process crash
If your whole process is crashed during the transaction, call `runTx.fixCrash()` after your process restarted (and make sure mongodb is connected), this function would try to rollback `running/rollingback` transactions, and commit `committing` onces.

### [WriteConcern](https://docs.mongodb.com/manual/reference/write-concern/)
All collections in this library is using `{ w: 1, j: 1 }` to make sure writing to journal, and you can change it if needed.

## Usage
```js
import mongoTx from 'mongo-tx'
import createMongoModel from 'mongo-tx/lib/implements/create-mongo-model'
import createMongoLock from 'mongo-tx/lib/implements/create-mongo-lock'

const runTx = mongoTx({ // mongoTx options
  createModel: createMongoModel({ db: nativeDb }),
  createLock: createMongoLock({ db: nativeDb, wait: true }), // wait is true: wait until current release is release instead of throw an error
  txColName: 'tx_manager', // collection name of transactions, default `tx_manager`
  commitRetry: 3, // commit retry times, default is 3
  commitInterval: 300, // commit retry interval, default is 300ms
  rollbackRetry: 3, // rollback retry times, default is 3
  rollbackInterval: 300, // rollback retry interval, default is 300ms
  lockTxName: true, // whether create a lock for the transaction name, this would cause transactions with the same name runs serially, default is true
})

/**
 * @param {string|array} txName can be an array to create multi locks for txName
 * @param {object} options optional, would override mongoTx options
 * @param {function} fn async function to run your transtaion
 * @type {[type]}
 */
await runTx('some_transfer', async tx => {
  const TxAccounts = tx.wrap('accounts')
  let acc1 = await TxAccounts.findOne({name: 'u1'}, {_id: 1})
  let acc2 = await TxAccounts.findOne({name: 'u2'}, {_id: 1})
  // manually lock before query or auto lock before modify like `findOneAndUpdate`
  await TxAccounts.lock(acc1._id)
  await TxAccounts.lock(acc2._id)
  acc1 = await TxAccounts.findOne({_id: acc1._id})
  acc2 = await TxAccounts.findOne({_id: acc2._id})
  
  await TxAccounts.findOneAndUpdate({
    name: 'u1',
  }, {
    $set: {
      money: acc1.money - 100,
    },
  })
  throw new Error('Some error cause auto rollback!')
  await TxAccounts.findOneAndUpdate({
    name: 'u2',
  }, {
    $set: {
      money: acc2.money + 100,
    },
  })
})

// other code
```

## Tips

1. runTx would only lock before documents' first modification in default, if you need to lock the query operation, you can call `await TxModel.lock(docId)` before the query, it's ok to lock multi times, it would only work at the first time.

For more use case please see test folder.

For more options  please see each implements.

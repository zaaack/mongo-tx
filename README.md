# mongo-tx
A flexible &amp; extensible mongodb transaction library.

[![Build Status](https://travis-ci.org/zaaack/mongo-tx.svg?branch=master)](https://travis-ci.org/zaaack/mongo-tx) [![npm](https://img.shields.io/npm/v/mongo-tx.svg)](https://www.npmjs.com/package/mongo-tx) [![npm](https://img.shields.io/npm/dm/mongo-tx.svg)](https://www.npmjs.com/package/mongo-tx)
## Install

`npm i --save mongo-tx`

or

`yarn add mongo-tx`

## How to

### Intro
When you create a transaction and run it, You need to use model wrappers to modify data during transactions, each model wrapper would create lock and snapshot before find/findOne/create/modifie/remove documents, after all operations of these documents in this transaction have succeeded, transaction manager will remove all snapshots and release all locks (committing). If error happened in this transaction, all changed documents will be replaced by snapshots and locks will also be released (rollingback).

### Lock
Built-in lock is implemented by mongo's unique key, and using [jdarling/MongoMQ](https://github.com/jdarling/MongoMQ) to create a waiting lock. You can create your own lock by redis, ssdb or other library.

**NOTICE:**

1. This kind of lock won't work like any relational database, you need to manually acquire a lock to make sure it's a synchronized operation. If you need to make sure "the locked document" in transaction is also locked in any other place, you'd better create a transaction for it, or acquire a document lock:
2. Waiting lock is not safe as you expected, it would fail in many cases, like too much transactions using same lock to cause time out, loop locks cause dead lock and time out (tx1 need lock acc1 & acc2, it has locked acc1; tx2 need lock acc2 & acc1, and it has locked acc2, then they would both fail with time out error), e.g. Just make sure you know waiting lock would fail.


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
  lockTxName: false, // whether create a lock for the transaction name, this would cause transactions with the same name runs serially, default is false
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

## TxModel

```js

class TxModel {
  /**
   * insert document
   * @param  {object} doc
   * @return {} document with _id     
   */
  create(doc: object) {
    // ...
  },
  /**
   * find documents
   * @param  {object} match query expression
   * @return {Array<object>} documents
   */
  find(match) {
    // ...
  },
  /**
   * find one document
   * @param  {object} match query expression
   * @return {object} document
   */
  findOne(match) {
    // ...
  },
  /**
   * findOneAndUpdate
   * @param  {object} match query expression
   * @param  {object} update  update expression
   * @param  {object} options see native-mongo-driver
   * @return {object}         original doc or new doc
   */
  findOneAndUpdate(match, update, options) {
    // ...
  },
  /**
   * findOneAndRemove
   * @param  {object} match query expression
   * @param  {object} options see native-mongo-driver
   * @return {object}         original doc
   */
  findOneAndRemove(match, options) {
    // ...
  },
}

```

## Tips

For more use case please see test folder.

For more options  please see each implements.

# mongo-tx
A flexible &amp; extensible mongodb transaction library.

[![Build Status](https://travis-ci.org/zaaack/mongo-tx.svg?branch=master)](https://travis-ci.org/zaaack/mongo-tx)

## Install

`npm i --save mongo-tx`

or

`yarn add mongo-tx`


## Usage
```js
import mongoTx from 'mongo-tx'
import createMongoModel from 'mongo-tx/lib/implements/create-mongo-model'
import createMongoLock from 'mongo-tx/lib/implements/create-mongo-lock'
import createMongoMQ from 'mongo-tx/lib/implements/create-mongo-mq'

const runTx = mongoTx({
  createModel: createMongoModel({ db: nativeDb }),
  createLock: createMongoLock({ db: nativeDb, wait: true }),
})

await runTx('some_transfer', async tx => {
  const TxAccounts = tx.wrap('accounts')
  const acc1 = await TxAccounts.findOne({name: 'u1'})
  const acc2 = await TxAccounts.findOne({name: 'u2'})
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

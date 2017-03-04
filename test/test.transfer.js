import test from 'ava'
import Mongorito, { Model } from 'mongorito'
import mongoTx from '../lib/tx-manager'
import { LockedError } from '../lib/errors'
import createMongoritoModel from '../lib/implements/create-mongorito-model'
import createMongoLock from '../lib/implements/create-mongo-lock'
import createMongoMQ from '../lib/implements/create-mongo-mq'

const db = new Mongorito('localhost/mongo_tx_test')
let createTx
class Accounts extends Model {
}

class Txs extends Model {
  static collection() {
    return '__tx_manager'
  }
}

class Locks extends Model {
  static collection() {
    return '__tx_locks'
  }
}

db.register(Accounts)
db.register(Txs)
db.register(Locks)

// TODO: `before` runs before every test
test.before(async t => {
    // this runs before all tests
  await db.connect()
  let nativeDb = await db.connection()
  await nativeDb.dropDatabase()
  await db.connect()
  nativeDb = await db.connection()
  createTx = mongoTx({
    createModel: createMongoritoModel({ db }),
    createLock: createMongoLock({
      db: nativeDb,
      queue: createMongoMQ({
        databaseName: db.databaseName,
        queueCollection: '__mongomq',
      }),
    }),
  })

  for (let i = 1; i <= 5; i++) {
    await (new Accounts({ name: 'u' + i, money: 1000 })).save()
  }
})

async function transfer(_createTx = createTx, throws) {
  await _createTx('transfer')
    .run(async tx => {
      const TxAccounts = tx.wrap(Accounts)
      const acc1 = await TxAccounts.findOne({name: 'u1'})
      const acc2 = await TxAccounts.findOne({name: 'u2'})
      await TxAccounts.findOneAndUpdate({
        name: 'u1',
      }, {
        $set: {
          money: acc1.money - 100,
        },
      })
      throws && throws()
      await TxAccounts.findOneAndUpdate({
        name: 'u2',
      }, {
        $set: {
          money: acc2.money + 100,
        },
      })
    })
}
async function transferWithError() {
  try {
    await transfer(createTx, () => {
      const err = Error('Some error occured in transaction')
      err.expected = true
      throw err
    })
  } catch (e) {
    if (!e.expected) {
      throw e
    } else {
      console.log('transferWithError', e.message)
    }
  }
}

test('test commit', async t => {
  await transfer()
  await transfer()

  const acc1 = await Accounts.findOne({name: 'u1'})
  const acc2 = await Accounts.findOne({name: 'u2'})
  t.is(acc1.get('money'), 800, 'u1\'s money should be 800')
  t.is(acc2.get('money'), 1200, 'u2\'s money should be 1200')
})

test('test locked error', async t => {
  const tasks = []
  tasks.push(t.notThrows(transfer()))
  tasks.push(t.throws(transfer(), LockedError))
  await Promise.all(tasks)

  const acc1 = await Accounts.findOne({name: 'u1'})
  const acc2 = await Accounts.findOne({name: 'u2'})
  t.is(acc1.get('money'), 700, 'u1\'s money should be 700')
  t.is(acc2.get('money'), 1300, 'u2\'s money should be 1300')
})

test('test locked wait', async t => {
  const nativeDb = await db.connection()
  const createWaitTx = mongoTx({
    createModel: createMongoritoModel({ db }),
    createLock: createMongoLock({ db: nativeDb, wait: true }),
  })
  const tasks = []
  for (var i = 0; i < 5; i++) {
    tasks.push(transfer(createWaitTx))
  }
  await Promise.all(tasks)

  const acc1 = await Accounts.findOne({name: 'u1'})
  const acc2 = await Accounts.findOne({name: 'u2'})
  t.is(acc1.get('money'), 200, 'u1\'s money should be 200')
  t.is(acc2.get('money'), 1800, 'u2\'s money should be 1800')
})

test('test rollback', async t => {
  await transferWithError()
  await transferWithError()

  const acc1 = await Accounts.findOne({name: 'u1'})
  const acc2 = await Accounts.findOne({name: 'u2'})
  t.is(acc1.get('money'), 200, 'u1\'s money should be 200')
  t.is(acc2.get('money'), 1800, 'u2\'s money should be 1800')
})

 // TODO: test crash
test('test crash', async t => {
  await transferWithError()
  await transferWithError()

  const acc1 = await Accounts.findOne({name: 'u1'})
  const acc2 = await Accounts.findOne({name: 'u2'})
  t.is(acc1.get('money'), 200, 'u1\'s money should be 200')
  t.is(acc2.get('money'), 1800, 'u2\'s money should be 1800')
})
import { MongoMQ } from 'mongomq'


export default function createQueue(options) {
  return new MongoMQ({
    databaseName: 'jubaopeng-server',
    queueCollection: 'tx_lock_queue',
    autoStart: true,
    ...options
  })
}

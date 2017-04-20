import { MongoMQ } from 'mongomq'
import ascoltatori from 'ascoltatori'
import pify from 'pify'

const pAscoltatori = pify(ascoltatori)

export default async function createQueue(options) {
  return pAscoltatori.build({
    type: 'mongo',
    pubsubCollection: 'ascoltatori',
    mongo: {}, // mongo specific options
    ...options,
  })
}

// export default function createQueue(options) {
//   return new MongoMQ({
//     databaseName: 'jubaopeng-server',
//     queueCollection: 'tx_lock_queue',
//     autoStart: true,
//     ...options
//   })
// }

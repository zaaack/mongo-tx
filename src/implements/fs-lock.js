import fs from 'fs'
import pify from 'pify'
import path from 'path'

const pFs = pify(fs)

export class FsLock {
  constructor(name, dir = '/tmp/node-mongo-tx-fslock') {
    this.name = name
    this.file = path.resolve(dir, `${name}.lock`)
  }

  lock() {
    return pFs.open(this.file, 'wx+')
      .then(fd => pFs.close(fd))
      .then(() => true)
  }

  release() {
    return pFs.unlink(this.file)
  }
}

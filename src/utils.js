
import Debug from 'debug'
import crypto from 'crypto'

export function sleep(ms) {
  if (ms < 0) ms = 0
  return new Promise(resolve => setTimeout(resolve, ms))
}
export const debug = Debug('mongo-tx')

export const randomStr = (bytes = 4) => {
  const hex = crypto.randomBytes(bytes).toString('hex')
  return parseInt(hex, 16).toString(36)
}

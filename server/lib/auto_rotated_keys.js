const { cookieMaxAge, autoRotateKeys: leadingServer } = require('config')
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { getRandomBytesBuffer } = __.require('lib', 'crypto')
const { oneDay } = __.require('lib', 'times')
const { readFileSync } = require('fs')
const { invert } = require('lodash')
const { writeFile } = require('fs').promises
const { expired } = _
// If a session is started at the end-of-life of a key
// that session should be allowed to live for cookieMaxAge time
const keysHalfTtl = cookieMaxAge
const keysFilePath = __.path('root', 'config/.sessions_keys')
const keys = []
const data = {}

const getKeysFromFile = () => {
  return readFileSync(keysFilePath)
  .toString()
  .split('\n')
  .map(line => {
    const [ timestampStr, key ] = line.trim().split(':')
    const timestamp = parseInt(timestampStr)
    return { timestamp, key }
  })
}

// Use sync operations to make sure we recovered existing keys before the server starts
const recoverKeysFromFile = () => {
  _.info('recover keys from file')
  try {
    getKeysFromFile().forEach(recoverKey)
  } catch (err) {
    if (err.code !== 'ENOENT') throw err
  }
}

const updateKeysFromFile = () => {
  _.info('update keys from file')
  try {
    getKeysFromFile().forEach(updateKey)
    cleanupKeysInMemory()
  } catch (err) {
    // Retry in a few seconds, in the hope that the leading server started by then
    // and created that file
    if (err.code === 'ENOENT') setTimeout(updateKeysFromFile, 1000)
    else throw err
  }
}

const recoverKey = ({ timestamp, key }) => {
  keys.push(key)
  data[timestamp] = key
}

const updateKey = ({ timestamp, key }) => {
  if (!keys.includes(key)) {
    keys.unshift(key)
    data[timestamp] = key
  }
}

const generateNewKey = () => {
  _.info('generating new key')
  const newKey = getRandomBytesBuffer(64).toString('base64')
  keys.unshift(newKey)
  data[Date.now()] = newKey
  cleanupKeysInMemory()
  persistKeysToDisk()
}

const cleanupKeysInMemory = () => {
  const timestampByKey = invert(data)
  keys.sort((keyA, keyB) => timestampByKey[keyB] - timestampByKey[keyA])
  // Keep maximum 2 keys at the same time
  // The more keys, the worst performance gets for worst-cases
  // See https://github.com/crypto-utils/keygrip#api
  if (keys.length > 2) keys.splice(2, 10)
}

const persistKeysToDisk = () => {
  const file = Object.keys(data)
    .sort(newestFirst)
    .slice(0, 2)
    .map(timestamp => `${timestamp}:${data[timestamp]}`)
    .join('\n')

  writeFile(keysFilePath, file)
  .then(() => _.info('updated keys persisted'))
  .catch(_.Error('failed to persist keys'))
}

const newestFirst = (a, b) => b - a

const checkState = () => {
  const role = leadingServer ? 'leading' : 'following'
  _.info(`checking keys state as ${role} instance`)
  if (leadingServer) {
    const newestKeyTimestampStr = Object.keys(data).sort(newestFirst)[0]
    if (newestKeyTimestampStr) {
      const newestKeyTimestamp = parseInt(newestKeyTimestampStr)
      // Issue a new key once we reach the newest key half-life
      if (expired(newestKeyTimestamp, keysHalfTtl)) generateNewKey()
      else _.info(`next key update in ${newestKeyTimestamp + keysHalfTtl - Date.now()}ms`)
    } else {
      generateNewKey()
    }
  } else {
    updateKeysFromFile()
  }
}

const checkPeriodicity = Math.min(oneDay, keysHalfTtl / 2)
setInterval(checkState, checkPeriodicity)

recoverKeysFromFile()
checkState()

// Share the keys array to be able to update it by mutation
module.exports = keys

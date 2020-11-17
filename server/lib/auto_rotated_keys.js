const { cookieMaxAge } = require('config')
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { getRandomBytesBuffer } = __.require('lib', 'crypto')
const { oneDay } = __.require('lib', 'times')
const { readFileSync } = require('fs')
const { writeFile } = require('fs').promises
const { expired } = _
// If a session is started at the end-of-life of a key
// that session should be allowed to live for cookieMaxAge time
const keysTtl = cookieMaxAge * 2
const keysFilePath = __.path('root', 'config/.sessions_keys')
const keys = []
const data = {}

// Use sync operations to make sure we recovered existing keys before the server starts
const recoverKeysFromFile = () => {
  _.info('recover keys from file')
  try {
    readFileSync(keysFilePath)
    .toString()
    .split('\n')
    .forEach(recoverKeyFromLine)
  } catch (err) {
    if (err.code !== 'ENOENT') throw err
  }
}

const recoverKeyFromLine = line => {
  const [ timestampStr, key ] = line.trim().split(':')
  const timestamp = parseInt(timestampStr)
  keys.push(key)
  data[timestamp] = key
}

const generateNewKey = () => {
  _.info('generating new key')
  const newKey = getRandomBytesBuffer(64).toString('base64')
  keys.unshift(newKey)
  data[Date.now()] = newKey
  // Keep maximum 2 keys at the same time
  // The more keys, the worst performance gets for worst-cases
  // See https://github.com/crypto-utils/keygrip#api
  if (keys.length > 2) keys.splice(2, 10)
  persistKeys()
}

const persistKeys = () => {
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
  const newestKeyTimestamp = Object.keys(data).sort(newestFirst)[0]
  if (newestKeyTimestamp) {
    // Issue a new key once we reach the newest key half-life
    if (expired(newestKeyTimestamp, keysTtl / 2)) generateNewKey()
  } else {
    generateNewKey()
  }
}

setInterval(checkState, oneDay)

recoverKeysFromFile()
checkState()

// Share the keys array to be able to update it by mutation
module.exports = keys

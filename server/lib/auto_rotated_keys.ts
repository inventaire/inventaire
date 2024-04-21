// This module recovers keys in config/.sessions_keys, and creates and keeps updated
// an array of keys that will be passed to auth middlewares to sign cookies

// There are presently no automated tests for this behavior, but manual tests can be run
// by deleting config/.sessions_keys and/or setting cookieMaxAge to a lower value in your config/local.cjs
// The default dev server can be started with config.autoRotateKeys=true and
// the API tests server with config.autoRotateKeys=false
// just make sure that both use the same config.cookieMaxAge value to avoid outdated keys errors

import { readFileSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { absolutePath } from '#lib/absolute_path'
import { getRandomBytes } from '#lib/crypto'
import { newError } from '#lib/error/error'
import { oneDay, msToHumanTime, msToHumanAge } from '#lib/time'
import { invert } from '#lib/utils/base'
import { warn, info, LogError } from '#lib/utils/logs'
import config from '#server/config'

const { cookieMaxAge, autoRotateKeys: leadingServer } = config
// If a session is started at the end-of-life of a key
// that session should be allowed to live for cookieMaxAge time
const keysHalfTtl = cookieMaxAge
const keysFilePath = absolutePath('root', 'config/.sessions_keys')

type Key = string
const keys: Key[] = []
const data: Record<EpochTimeStamp, Key> = {}

function getKeysFromFileSync () {
  return readFileSync(keysFilePath)
  .toString()
  .split('\n')
  .filter(line => /^\d+/.test(line))
  .map(line => {
    const [ timestampStr, key ] = line.trim().split(':')
    const timestamp = parseInt(timestampStr)
    return { timestamp, key }
  })
}

// Use sync operations to make sure we recovered existing keys before the server starts
function recoverKeysFromFile () {
  try {
    getKeysFromFileSync().forEach(recoverKey)
  } catch (err) {
    if (err.code !== 'ENOENT') throw err
  }
}

function getKeysStatus () {
  return Object.keys(data).map(timestampStr => {
    const timestamp = parseInt(timestampStr)
    return {
      created: new Date(timestamp).toISOString(),
      age: msToHumanAge(timestamp),
      expireIn: msToHumanTime(timestamp + (2 * keysHalfTtl) - Date.now()),
    }
  })
}

function updateKeysFromFile () {
  info('update keys from file')
  try {
    getKeysFromFileSync().forEach(updateKey)
    cleanupKeysInMemory()
  } catch (err) {
    if (err.code === 'ENOENT') throw missingKeysError()
    else throw err
  }
}

function recoverKey ({ timestamp, key }) {
  keys.push(key)
  data[timestamp] = key
}

function updateKey ({ timestamp, key }) {
  if (!keys.includes(key)) {
    keys.unshift(key)
    data[timestamp] = key
  }
}

function generateNewKey () {
  info('generating new key')
  const newKey = getRandomBytes(64, 'base64')
  keys.unshift(newKey)
  data[Date.now()] = newKey
  cleanupKeysInMemory()
  saveKeysToDisk()
  const nextCheck = Math.min(oneDay, keysHalfTtl + 100)
  setTimeout(checkState, nextCheck)
}

function cleanupKeysInMemory () {
  keys.sort(newestFirstFromKeys)
  // Keep maximum 2 keys at the same time
  // The more keys, the worst performance gets for worst-cases
  // See https://github.com/crypto-utils/keygrip#api
  if (keys.length > 2) keys.splice(2, 10)
}

function saveKeysToDisk () {
  info('saving keys')
  const file = Object.keys(data)
    .sort(newestFirst)
    .slice(0, 2)
    .map(timestamp => `${timestamp}:${data[timestamp]}`)
    .join('\n')

  writeFile(keysFilePath, file, { mode: 0o600 })
  .then(() => info('updated keys saved'))
  .catch(LogError('failed to save keys'))
}

const newestFirst = (a, b) => b - a
function newestFirstFromKeys (keyA, keyB) {
  const timestampByKey = invert(data)
  return timestampByKey[keyB] - timestampByKey[keyA]
}

function checkState () {
  const role = leadingServer ? 'leading' : 'following'
  if (leadingServer) {
    info(`Checking keys state as ${role} instance`)
    const timeUntilEndOfNewestKeyHalfLife = getTimeUntilEndOfNewestKeyHalfLife()
    if (timeUntilEndOfNewestKeyHalfLife != null) {
      if (timeUntilEndOfNewestKeyHalfLife < 0) {
        generateNewKey()
      } else {
        info(`${keys.length} keys alive - next key update in ${msToHumanTime(timeUntilEndOfNewestKeyHalfLife)}`)
        // The timeout needs to fit in a 32-bit signed integer to not trigger a TimeoutOverflowWarning
        // thus the 10 days cap
        const nextCheck = Math.min(oneDay * 10, timeUntilEndOfNewestKeyHalfLife + 100)
        setTimeout(checkState, nextCheck)
      }
    } else {
      generateNewKey()
    }
  } else {
    warn(`Checking keys state as ${role} instance:\nexpects another instance to do the key auto-rotation`)
    updateKeysFromFile()
    // When not the leading server, check at least every day
    // as keys might have been invalidated
    const timeUntilEndOfNewestKeyHalfLife = getTimeUntilEndOfNewestKeyHalfLife()
    if (timeUntilEndOfNewestKeyHalfLife == null) throw missingKeysError()
    if (timeUntilEndOfNewestKeyHalfLife < 0) throw outdatedKeysError()
    const nextCheck = Math.min(oneDay, timeUntilEndOfNewestKeyHalfLife + 5000)
    setTimeout(checkState, nextCheck)
  }
}

function getTimeUntilEndOfNewestKeyHalfLife () {
  const newestKeyTimestampStr = Object.keys(data).sort(newestFirst)[0]
  if (!newestKeyTimestampStr) return
  const newestKeyTimestamp = parseInt(newestKeyTimestampStr)
  const halfLifeTime = newestKeyTimestamp + keysHalfTtl
  return halfLifeTime - Date.now() + 100
}

const fixMessage = `Start a leading server (with config.autoRotateKeys=true) to fix.
Also make sure to use the same config.cookieMaxAge value`

const missingKeysError = () => newError(`no key found: ${fixMessage}`, 500)
const outdatedKeysError = () => newError(`found outdated keys: ${fixMessage}`, 500, { keysStatus: getKeysStatus() })

recoverKeysFromFile()
checkState()

// Share the keys array to be able to update it by mutation
export default keys

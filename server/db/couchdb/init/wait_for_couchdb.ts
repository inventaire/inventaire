import fetch from 'node-fetch'
import { grey, yellow } from 'tiny-chalk'
import { wait } from '#lib/promises'
import { getTimeoutSignal } from '#lib/requests'
import config from '#server/config'

const { username, password } = config.db
const couchdbOrigin = config.db.getOriginSansAuth()

export function waitForCouchdb () {
  async function testAvailability (delay) {
    await wait(delay)

    try {
      const res = await fetch(couchdbOrigin, {
        headers: {
          authorization: `Basic ${getBasicCredentials(username, password)}`,
        },
        signal: getTimeoutSignal(5000),
      })
      if (res.status === 401) throw new Error('CouchDB name or password is incorrect')
      if (res.status !== 200) throw new Error(`Connexion to CouchDB failed: ${res.status}: ${res.statusText}`)
    } catch (err) {
      if (err.type === 'aborted' || err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
        const warningMessage = yellow('waiting for CouchDB on')
        console.warn(warningMessage, obfuscateLogin(couchdbOrigin), grey(`(${err.code || err.name})`))
        return testAvailability(500)
      } else {
        throw err
      }
    }
  }

  return testAvailability(0)
}

function obfuscateLogin (dbBaseUrl) {
  return dbBaseUrl
  .replace(/(https?):\/\/(\w+):([^@]+)@/, '$1://$2:*************@')
}

function getBasicCredentials (username: string, password: string) {
  return Buffer.from(`${username}:${password}`).toString('base64')
}

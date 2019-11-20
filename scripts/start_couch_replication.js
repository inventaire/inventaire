#!/usr/bin/env node


// Fix any style issues and re-enable lint.

const breq = require('bluereq')
const CONFIG = require('config')
const __ = CONFIG.universalPath
const chalk = require('chalk')
const { range } = require('lodash')
const { green, red, blue } = chalk

// equivalent to curl -k
// required to use self-signed ssl keys
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const IP = /^[0-9.]{7,15}$/
let { from, ip, suffix, protocol, port, localPort, continuous, persist } = CONFIG.replication
if (!protocol) protocol = 'https'
if (!port) port = 6984
if (!localPort) localPort = 6984
if (continuous == null) continuous = true

const persistFromArgv = process.argv.slice(2)[0] === 'persist'

const endpoint = persist || persistFromArgv ? '_replicator' : '_replicate'

if (from == null) {
  throw new Error(`bad CONFIG.replication.from: ${from}`)
}
if (!IP.test(ip)) {
  throw new Error(`bad CONFIG.replication.ip: ${ip}`)
}
if (suffix == null) {
  throw new Error(`bad CONFIG.replication.suffix: ${suffix}`)
}
console.log(`${green('valid replication config found: ')}${from} @ ${ip}`)

const { username, password } = CONFIG.db
if ((username == null) || (password == null)) {
  throw new Error('missing username or password in CONFIG.db')
}

let { username: remoteUsername, password: remotePassword } = CONFIG.replication
// If no replication credentials where passed, assume those are the same as the local ones
remoteUsername = remoteUsername || username
remotePassword = remotePassword || password

let pw = range(3, password.length + 1)
  .map(() => '•')
  .join('')
pw = password.slice(0, 3) + pw

console.log(`${green('valid username and password found: ')}${username} / ${pw}`)

let dbsNames = Object.keys(__.require('db', 'couch/list'))
dbsNames = dbsNames.map(name => `${name}-${suffix}`)
console.log(green('dbs names found: ') + dbsNames)

const localDb = dbName => `${protocol}://${username}:${password}@localhost:${localPort}/${dbName}`

const localReplicate = dbName => `${protocol}://${username}:${password}@localhost:${localPort}/${endpoint}`

const remoteDb = dbName => `${protocol}://${remoteUsername}:${remotePassword}@${ip}:${port}/${dbName}`

dbsNames.forEach(dbName => {
  // pulling seems better than pushing
  // http://wiki.apache.org/couchdb/How_to_replicate_a_database
  const repDoc = {
    source: remoteDb(dbName),
    target: localDb(dbName),
    continuous
  }

  return breq.get(remoteDb(dbName))
  .then(res => {
    console.log(green(`${dbName} handcheck: `))
    console.log(res.body)
    return breq.post(localReplicate(dbName), repDoc)
    .then(res => {
      const color = res.body.ok != null ? 'green' : 'red'
      console.log(chalk[color](`${dbName} replication response: `))
      return console.log(res.body)
    })
  })
  .timeout(20000)
  .catch(err => console.log(err))
})

// TRYING TO PUT SECURITY DOC
// will fail if db where already initialized

const _securityDoc = __.require('couchdb', 'security_doc')

const putSecurityDoc = dbUrl => {
  const url = `${dbUrl}/_security`
  console.log(url, blue('trying to put security doc'))
  return breq.put(url, _securityDoc)
  .then(res => console.log(res.body, green('putSecurityDoc')))
  .catch(err => console.error(err, red('putSecurityDoc')))
}

dbsNames.forEach(dbName => putSecurityDoc(localDb(dbName)))

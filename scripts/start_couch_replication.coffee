#!/usr/bin/env coffee

breq = require 'bluereq'
CONFIG = require 'config'
__ = CONFIG.universalPath
chalk = require 'chalk'
{ green, red, blue } = chalk

# equivalent to curl -k
# required to use self-signed ssl keys
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

IP = /^[0-9.]{7,15}$/
{ from, ip, suffix, protocol, port, localPort, continuous } = CONFIG.replication
protocol or= 'https'
port or= 6984
localPort or= 6984
continuous ?= true

unless from?
  throw new Error "bad CONFIG.replication.from: #{from}"
unless IP.test(ip)
  throw new Error "bad CONFIG.replication.ip: #{ip}"
unless suffix?
  throw new Error "bad CONFIG.replication.suffix: #{suffix}"
console.log green("valid replication config found: ") + "#{from} @ #{ip}"

{ username, password } = CONFIG.db
unless username? and password?
  throw new Error "missing username or password in CONFIG.db"

{ username:remoteUsername, password:remotePassword } = CONFIG.replication
# If no replication credentials where passed, assume those are the same as the local ones
remoteUsername or= username
remotePassword or= password

pw = [3..password.length]
.map -> "•"
.join ''
pw = password[0..2] + pw

console.log green("valid username and password found: ") + "#{username} / #{pw}"

dbsNames = Object.keys __.require('db', 'couch/list')
dbsNames = dbsNames.map (name)-> "#{name}-#{suffix}"
console.log green("dbs names found: ") +  dbsNames

localDb = (dbName)->
  "#{protocol}://#{username}:#{password}@localhost:#{localPort}/#{dbName}"

localReplicate = (dbName)->
  "#{protocol}://#{username}:#{password}@localhost:#{localPort}/_replicate"

remoteDb = (dbName)->
  "#{protocol}://#{remoteUsername}:#{remotePassword}@#{ip}:#{port}/#{dbName}"

dbsNames.forEach (dbName)->
  # pulling seems better than pushing
  # http://wiki.apache.org/couchdb/How_to_replicate_a_database
  repDoc =
    source: remoteDb(dbName)
    target: localDb(dbName)
    continuous: continuous

  breq.get remoteDb(dbName)
  .then (res)->
    console.log green("#{dbName} handcheck: ")
    console.log res.body
    breq.post localReplicate(dbName), repDoc
    .then (res)->
      if res.body.ok? then color = 'green'
      else color = 'red'
      console.log chalk[color]("#{dbName} replication response: ")
      console.log res.body

  # excessive time could mean that the firewall isn't opened to this machine
  .timeout 20000
  .catch (err)-> console.log err

# TRYING TO PUT SECURITY DOC
# will fail if db where already initialized

_securityDoc = __.require 'couchdb', 'security_doc'

putSecurityDoc = (dbUrl)->
  url = "#{dbUrl}/_security"
  console.log url, blue('trying to put security doc')
  breq.put url, _securityDoc
  .then (res)-> console.log res.body, green('putSecurityDoc')
  .catch (err)-> console.error err, red('putSecurityDoc')

dbsNames.forEach (dbName)-> putSecurityDoc localDb(dbName)

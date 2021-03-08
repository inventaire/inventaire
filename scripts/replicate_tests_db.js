#!/usr/bin/env node
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const requests_ = __.require('lib', 'requests')
const error_ = __.require('lib', 'error/error')

const dbHost = require('config').db.fullHost()

const dbUrl = dbName => `${dbHost}/${dbName}`
const dbsBaseNames = Object.keys(__.require('db', 'couchdb/list'))

const replicate = async dbName => {
  const dbTestName = `${dbName}-tests`
  const repDoc = {
    source: dbUrl(dbTestName),
    target: dbUrl(dbName)
  }
  return requests_.post(`${dbHost}/_replicate`, { body: repDoc })
  .then(_.Log(`${dbTestName} replication response`))
}

Promise.all(dbsBaseNames.map(replicate))
.catch(err => {
  console.log(`${err.body.reason}\nHum, have you ran the tests first ?`)
  error_.catchNotFound(err)
})

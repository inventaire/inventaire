#!/usr/bin/env node
require('module-alias/register')
const _ = require('builders/utils')
const requests_ = require('lib/requests')
const error_ = require('lib/error/error')

const dbHost = require('config').db.fullHost()

const dbUrl = dbName => `${dbHost}/${dbName}`
const dbsBaseNames = Object.keys(require('db/couchdb/list'))

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

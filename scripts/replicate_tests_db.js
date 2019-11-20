#!/usr/bin/env node
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const breq = require('bluereq')
const { Promise } = __.require('lib', 'promises')
const error_ = __.require('lib', 'error/error')

const dbHost = require('config').db.fullHost()

const dbUrl = dbName => `${dbHost}/${dbName}`
const dbsBaseNames = Object.keys(__.require('couch', 'list'))

Promise.all(dbsBaseNames)
.map(dbName => {
  const dbTestName = `${dbName}-tests`
  const repDoc = {
    source: dbUrl(dbTestName),
    target: dbUrl(dbName)
  }
  return breq.post(`${dbHost}/_replicate`, repDoc)
  .then(res => res.body)
  .then(_.Log(`${dbTestName} replication response`))
})
.catch(err => {
  console.log(`${err.body.reason}\n\
  Hum, have you ran the tests first ?`)
  return error_.catchNotFound(err)
})

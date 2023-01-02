#!/usr/bin/env node
import CONFIG from 'config'
import _ from '#builders/utils'
import { catchNotFound } from '#lib/error/error'
import { requests_ } from '#lib/requests'

const dbHost = CONFIG.db.getOrigin()

const dbUrl = dbName => `${dbHost}/${dbName}`
const dbsBaseNames = Object.keys(await import('#db/couchdb/databases'))

const replicate = async dbName => {
  const dbTestName = `${dbName}-tests`
  const repDoc = {
    source: dbUrl(dbTestName),
    target: dbUrl(dbName),
  }
  return requests_.post(`${dbHost}/_replicate`, { body: repDoc })
  .then(_.Log(`${dbTestName} replication response`))
}

Promise.all(dbsBaseNames.map(replicate))
.catch(err => {
  console.log(`${err.body.reason}\nHum, have you ran the tests first ?`)
  catchNotFound(err)
})

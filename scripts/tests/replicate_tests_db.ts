#!/usr/bin/env -S node --loader ts-node/esm --no-warnings
import CONFIG from 'config'
import { databases } from '#db/couchdb/databases'
import { catchNotFound } from '#lib/error/error'
import { requests_ } from '#lib/requests'
import { Log } from '#lib/utils/logs'

const dbHost = CONFIG.db.getOrigin()

const dbUrl = dbName => `${dbHost}/${dbName}`
const dbsBaseNames = Object.keys(databases)

const replicate = async dbName => {
  const dbTestName = `${dbName}-tests`
  const repDoc = {
    source: dbUrl(dbTestName),
    target: dbUrl(dbName),
  }
  return requests_.post(`${dbHost}/_replicate`, { body: repDoc })
  .then(Log(`${dbTestName} replication response`))
}

Promise.all(dbsBaseNames.map(replicate))
.catch(err => {
  console.log(`${err.body.reason}\nHum, have you ran the tests first ?`)
  catchNotFound(err)
})

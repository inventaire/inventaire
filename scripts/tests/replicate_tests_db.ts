#!/usr/bin/env tsx
import { databases } from '#db/couchdb/databases'
import { authorizedCouchdbHeaders as headers } from '#db/couchdb/init/credentials'
import { catchNotFound } from '#lib/error/error'
import { requests_ } from '#lib/requests'
import { Log } from '#lib/utils/logs'
import config from '#server/config'

const dbOrigin = config.db.getOrigin()

const dbUrl = dbName => `${dbOrigin}/${dbName}`
const dbsBaseNames = Object.keys(databases)

const replicate = async dbName => {
  const dbTestName = `${dbName}-tests`
  const repDoc = {
    source: dbUrl(dbTestName),
    target: dbUrl(dbName),
  }
  return requests_.post(`${dbOrigin}/_replicate`, { body: repDoc, headers })
  .then(Log(`${dbTestName} replication response`))
}

Promise.all(dbsBaseNames.map(replicate))
.catch(err => {
  console.log(`${err.body.reason}\nHum, have you ran the tests first ?`)
  catchNotFound(err)
})

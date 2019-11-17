#!/usr/bin/env node
// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const elasticSearchHost = CONFIG.elasticsearch.host
const couchdbHost = CONFIG.db.fullHost()
const folder = __.path('scripts', 'couch2elastic4sync')
const { writeFile } = __.require('lib', 'fs')
const { syncDataList, indexesList } = __.require('db', 'elasticsearch/list')
const createIndex = require('./create_index')

const writeConfigFile = syncData => {
  const { dbName, type } = syncData

  const data = {
    database: `${couchdbHost}/${dbName}`,
    elasticsearch: `${elasticSearchHost}/${dbName}/${type}`,
    mapper: `${folder}/mappers/${type}.js`
  }

  return writeFile(`${folder}/configs/${dbName}.json`, JSON.stringify(data, null, 2))
  .then(() => _.log(`'${dbName}' config file generated`))
  .catch(_.ErrorRethrow(`'${dbName}' config file error`))
}

syncDataList.forEach(writeConfigFile)
// Creating indexes would be done by any POST operation
// but is required before any bulk operations:
// in doubt, let's make sure indexes are created
indexesList.forEach(createIndex)

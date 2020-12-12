#!/usr/bin/env node
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const elasticSearchHost = CONFIG.elasticsearch.host
const couchdbHost = CONFIG.db.fullHost()
const folder = __.path('scripts', 'couch2elastic4sync')
const { writeFile } = require('fs').promises
const { syncDataList, indexesList } = __.require('db', 'elasticsearch/list')
const createIndex = __.require('db', 'elasticsearch/create_index')

const writeConfigFile = syncData => {
  const { dbName, type } = syncData

  const data = {
    database: `${couchdbHost}/${dbName}`,
    elasticsearch: `${elasticSearchHost}/${dbName}`,
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

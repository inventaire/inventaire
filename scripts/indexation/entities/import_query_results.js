#!/usr/bin/env node
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')

const resultsFolder = './scripts/entities_indexation/queries/results'
const wdk = require('wikidata-sdk')

const types = require('./lib/types_parser')(resultsFolder, 'json')
const callOneByOne = require('./lib/call_one_by_one')
const fetchAndPutEntitiesFromUris = __.require('controllers', 'entities/lib/indexation/fetch_and_put_entities_from_uris')

const importEntities = type => {
  // Beware of the path leading dot: require works from __dirname
  // not from process.cwd()
  const uris = require(`./queries/results/${type}.json`)
    // filtering-out properties and blank nodes (type: bnode)
    .filter(wdk.isItemId)
    .map(id => `wd:${id}`)

  return fetchAndPutEntitiesFromUris(type, uris)
  .then(() => _.success(type, 'done'))
  .catch(_.ErrorRethrow(`importEntities err (type: ${type})`))
}

callOneByOne(types, 'import', importEntities)
.then(() => _.success(types, 'imports done'))
.catch(_.ErrorRethrow(`imports err (types: ${types})`))

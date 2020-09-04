const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const bulkPost = require('./bulk_post_to_elasticsearch')
const wdk = require('wikidata-sdk')
// omitting type, sitelinks
const props = [ 'labels', 'aliases', 'descriptions', 'claims' ]
const formatEntities = require('./format_entities')
const unindex = require('./unindex')
const { get } = __.require('lib', 'requests')
const invHost = CONFIG.fullHost()
const { wait } = __.require('lib', 'promises')
const { indexes, indexedEntitiesTypes } = __.require('controllers', 'search/lib/indexes')
const { wikidata: wdIndex, entities: invIndex } = indexes

module.exports = (type, uris) => {
  _.info(uris, `${type} uris`)

  const { wdIds, invUris } = uris.reduce(spreadIdsByDomain, { wdIds: [], invUris: [] })

  const promises = []

  if (indexedEntitiesTypes.includes(type)) {
    if (wdIds.length > 0) {
      // generate urls for batches of 50 entities
      const wdUrls = wdk.getManyEntities({ ids: wdIds, props })
      promises.push(PutNextBatch('wd', wdIndex, type, wdUrls))
    }

    if (invUris.length > 0) {
      const invUrl = getInvEntities(invUris)
      promises.push(PutNextBatch('inv', invIndex, type, [ invUrl ]))
    }
  } else {
    // If the type isn't allowlisted make sure the associated entity wasn't
    // indexed in another type before
    if (wdIds.length > 0) promises.push(unindex(wdIndex, '_all', wdIds))
    if (invUris.length > 0) promises.push(unindex(invIndex, '_all', invUris))
  }

  return Promise.all(promises)
}

const PutNextBatch = (domain, index, type, urls) => {
  const putNextBatch = async () => {
    const url = urls.shift()
    if (url == null) {
      _.success(`done putting ${type} batches`)
      return
    }

    _.info(url, `preparing next ${type} batch`)

    return getDataFormatAndPost({ url, domain, index, type })
    // Be nice to the API
    .then(() => wait(500))
    // Will call itself until there is no more urls to fetch
    .then(putNextBatch)
    .catch(_.ErrorRethrow('putNextBatch'))
  }

  return putNextBatch()
}

const getDataFormatAndPost = params => {
  const { url, type } = params
  return get(url)
  .then(unindexRemovedEntities(params))
  .then(removeMissingEntities)
  .then(formatEntities(type))
  .then(bulkPost.bind(null, type))
  .catch(retry(params))
}

const retry = params => async err => {
  if (err.statusCode === 429) {
    console.error('getDataFormatAndPost err (retrying in 5s)', err)
    await wait(5000)
    return getDataFormatAndPost(params)
  } else {
    throw err
  }
}

const unindexRemovedEntities = ({ domain, index, type }) => async ({ entities, redirects }) => {
  let urisToUnindex = []

  if (redirects != null) {
    urisToUnindex = urisToUnindex.concat(Object.keys(redirects))
  }

  if (domain === 'inv') {
    for (const uri in entities) {
      const entity = entities[uri]
      if (entity._meta_type === 'removed:placeholder') {
        urisToUnindex.push(uri)
        // Remove the entity from entities to index
        delete entities[uri]
      }
    }
  }

  await unindex(index, type, urisToUnindex)

  return entities
}

const removeMissingEntities = entities => {
  for (const id in entities) {
    const entity = entities[id]
    if (entity == null) {
      _.warn(id, 'missing value: ignored')
      delete entities[id]
    }

    if (!(entity && entity.claims)) {
      // Known case: desambiguation pages given the type meta
      _.warn(id, 'entity has no claims: ignored')
      delete entities[id]
    }
  }

  return entities
}

const spreadIdsByDomain = (data, uri) => {
  const [ prefix, id ] = uri.split(':')
  if (prefix === 'wd') {
    // filtering-out properties and blank nodes (type: bnode)
    if (!wdk.isItemId(id)) return data
    data.wdIds.push(id)
  } else {
    data.invUris.push(uri)
  }
  return data
}

const getInvEntities = uris => `${invHost}/api/entities?action=by-uris&uris=${uris.join('|')}`

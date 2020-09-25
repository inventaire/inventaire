const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { delay } = CONFIG.entitiesSearchEngine
const radio = __.require('lib', 'radio')
const updateFromUrisPerType = __.require('controllers', 'entities/lib/indexation/update_from_uris_per_type')

module.exports = () => {
  let urisPerType = {}

  const requestUpdate = () => {
    updateFromUrisPerType(urisPerType).catch(_.Error('entities search engine update err'))
    urisPerType = {}
  }

  // Send a batch every #{delay} milliseconds max
  const lazyRequestUpdate = _.throttle(requestUpdate, delay, { leading: false })

  const add = (uri, type = 'other') => {
    // Also include entities without known type
    // so that a Wikidata entity that got a wdt:P31 update
    // that doesn't match any known type still triggers an update
    // to unindex the formerly known type
    const pluralizedType = `${type}s`
    urisPerType[pluralizedType] = urisPerType[pluralizedType] || []

    // Deduplicating
    if (!urisPerType[pluralizedType].includes(uri)) {
      urisPerType[pluralizedType].push(uri)
    }

    return lazyRequestUpdate()
  }

  // Ideally, we should update Wikidata entities on every changes
  // but that would require to follow a change feed of Wikidata entities,
  // which isn't that straight forward, so refreshing on every cache miss instead,
  // that is, for every new entity + when cache expired + when a data refresh is requested
  radio.on('wikidata:entity:cache:miss', (wdId, type) => add(`wd:${wdId}`, type))
  radio.on('wikidata:entity:redirect', (fromUri, toUri) => add(fromUri))
}

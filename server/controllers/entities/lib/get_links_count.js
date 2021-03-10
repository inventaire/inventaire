// Get the amount of entities linking to a given entity
const _ = require('builders/utils')
const entities_ = require('./entities')
const runWdQuery = require('data/wikidata/run_query')

module.exports = (uri, refresh) => {
  const [ prefix, id ] = uri.split(':')
  const promises = []

  if (prefix === 'wd') { promises.push(getWdLinksScore(id, refresh)) }

  promises.push(getLocalLinksCount(uri))

  return Promise.all(promises)
  .then(_.sum)
  .catch(_.ErrorRethrow('get links count err'))
}

const getWdLinksScore = (qid, refresh) => {
  return runWdQuery({ query: 'links-count', qid, refresh })
  .then(_.first)
}

const getLocalLinksCount = uri => entities_.byClaimsValue(uri, true)

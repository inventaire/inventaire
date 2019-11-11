// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// Get the amount of entities linking to a given entity

const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const promises_ = __.require('lib', 'promises')
const entities_ = require('./entities')
const runWdQuery = __.require('data', 'wikidata/run_query')

module.exports = function(uri, refresh){
  const [ prefix, id ] = Array.from(uri.split(':'))
  const promises = []

  if (prefix === 'wd') { promises.push(getWdLinksScore(id, refresh)) }

  promises.push(getLocalLinksCount(uri))

  return promises_.all(promises)
  .then(_.sum)
  .catch(_.ErrorRethrow('get links count err'))
}

var getWdLinksScore = (qid, refresh) => runWdQuery({ query: 'links-count', qid, refresh })
.then(_.first)

var getLocalLinksCount = uri => entities_.byClaimsValue(uri, true)

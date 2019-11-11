// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { Promise } = __.require('lib', 'promises')
const entities_ = require('../entities')
const getInvEntityCanonicalUri = require('../get_inv_entity_canonical_uri')
const resolveExternalIds = require('./resolve_external_ids')
// Do not try to resolve edition on Wikidata while Wikidata editions are in quarantine
// cf https://github.com/inventaire/inventaire/issues/182
const resolveOnWikidata = false

module.exports = function(entry){
  const { isbn, claims } = entry.edition

  return Promise.all([
    resolveByIsbn(isbn),
    resolveExternalIds(claims, resolveOnWikidata)
  ])
  .spread(pickUriFromResolversResponses)
  .then((uri) => {
    if (uri != null) { entry.edition.uri = uri }
    return entry
  })
}

var resolveByIsbn = function(isbn){
  if (isbn == null) return 
  // Resolve directly on the database to avoid making undersired requests to dataseed
  return entities_.byIsbn(isbn)
  .then((edition) => { if (edition != null) { return getInvEntityCanonicalUri(edition) } })
}

var pickUriFromResolversResponses = function(uriFoundByIsbn, urisFoundByExternalIds){
  // TODO: handle possible conflict between uriFoundByIsbn and urisFoundByExternalIds
  if (uriFoundByIsbn != null) return uriFoundByIsbn
  if ((urisFoundByExternalIds != null) && (urisFoundByExternalIds.length === 1)) {
    return urisFoundByExternalIds[0]
  }
}

# DATA MODEL
# _id: CouchDB uuid
# claims: an object with properties and their associated statements

# labels?
# descriptions?
# aliases?
# sitelinks? qid?

# use Wikidata data model as reference:
# https://www.mediawiki.org/wiki/Wikibase/DataModel/JSON

CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
tests = require './tests/common-tests'
promises_ = __.require 'lib', 'promises'

{ properties, whitelist } = __.require 'controllers','entities/lib/properties'

module.exports = Entity =
  create: ->
    type: 'entity'
    labels: {}
    claims: {}

  addLabels: (doc, labels)->
    for lang, value of labels
      doc = addLabel doc, lang, value

    return doc

  addClaims: (doc, claims)->
    for prop, array of claims
      for value in array
        doc = Entity.createClaim doc, prop, value

    return doc

  createClaim: (doc, property, value)->
    doc.claims[property] or= []
    doc.claims[property].push value
    return doc

  updateClaim: (doc, property, oldVal, newVal)->
    # for new values, use createClaim instead
    unless oldVal?
      throw error_.new 'missing old value', 400, arguments

    propArray = _.get doc, "claims.#{property}"
    _.log oldVal, 'oldVal'
    _.log propArray, 'propArray'
    if not propArray? or oldVal not in propArray
      throw error_.new 'claim property value not found', 400, arguments

    if newVal?
      index = propArray.indexOf oldVal
      doc.claims[property][index] = newVal
    else
      # if the new value is undefined, it plays the role of a removeClaim
      doc.claims[property] = _.without propArray, oldVal

    return doc

addLabel = (doc, lang, value)->
  doc.labels[lang] = value
  return doc

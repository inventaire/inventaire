# DATA MODEL
# _id: CouchDB uuid
# claims: an object with properties and their associated statements
# labels: an object with labels in different languages

# labels?
# descriptions?
# aliases?
# sitelinks? qid?

# use Wikidata data model as reference:
# https://www.mediawiki.org/wiki/Wikibase/DataModel/JSON

# Used prefixes:
# Entities:
#   PREFIX wd: <http://www.wikidata.org/entity/>
#   PREFIX inv: <https://inventaire.io/entity/>
# Properties:
#   PREFIX wdt: <http://www.wikidata.org/prop/direct/>
#   PREFIX invp: <http://www.wikidata.org/property/>

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

  setLabel: (doc, lang, value)->
    doc.labels[lang] = value
    return doc

  setLabels: (doc, labels)->
    for lang, value of labels
      doc = Entity.setLabel doc, lang, value

    return doc

  addClaims: (doc, claims)->
    for property, array of claims
      prop = properties[property]
      # claims will be validated one by one later but some collective checks are needed

      if prop.uniqueValue
        if array.length > 1
          message = "#{property} expects a unique value, got #{array}"
          throw error_.new message, 400, arguments

      for value in array
        doc = Entity.createClaim doc, property, value

    return doc

  createClaim: (doc, property, value)->
    return Entity.updateClaim doc, property, null, value

  updateClaim: (doc, property, oldVal, newVal)->
    unless oldVal? or newVal?
      throw error_.new 'missing old or new value', 400, arguments

    propArray = _.get doc, "claims.#{property}"

    _.log propArray, 'propArray'
    _.log oldVal, 'oldVal'
    _.log newVal, 'newVal'

    if propArray? and newVal? and newVal in propArray
      throw error_.new 'claim property new value already exist', 400, arguments

    if oldVal?
      if not propArray? or oldVal not in propArray
        throw error_.new 'claim property value not found', 400, arguments

      if newVal?
        index = propArray.indexOf oldVal
        doc.claims[property][index] = newVal
      else
        # if the new value is null, it plays the role of a removeClaim
        doc.claims[property] = _.without propArray, oldVal

    else
      # if the old value is null, it plays the role of a createClaim
      doc.claims[property] or= []
      doc.claims[property].push newVal

    return doc

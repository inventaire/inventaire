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

module.exports =
  create: ->
    type: 'entity'
    claims: {}

  createClaim: (doc, property, value)->
    doc.claims[property] or= []
    doc.claims[property].push value
    return doc

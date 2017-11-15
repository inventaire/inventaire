# A module to put the basis of an edition entity based on the results
# from dataseed. It assumes that any seed arriving here found no match to its ISBN
# thus that a new edition entity is needed, for which we need to find a work.
# This last task, and the effort of reconciling with the existing entities
# is let to the responsability of the ./work module

CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
{ parse:parseIsbn } = __.require 'lib', 'isbn/isbn'
{ validatePropertyValueSync } = require '../entities'
createEntity = require '../create_entity'
# It is simpler to use a consistent, recognizable mocked user id
# than to put exceptions everywhere
seedUserId = __.require('couch', 'hard_coded_documents').users.seed._id
scaffoldWorkEntityFromSeed = require './work'

# seed attributes:
# MUST have: isbn
# MAY have: title, authors, image, publicationDate, numberOfPages
# Data deduced from isbn: isbn13h, groupLang

# Motivation to accept seeds without title or author:
# Every isbn needs to have its edition entity and an associated author entity,
# thus we create the expected entities what so ever

module.exports = (seed)->
  { isbn } = seed
  unless _.isNonEmptyString isbn
    return error_.reject 'missing isbn', 400, seed

  _.log seed, 'edition seed'

  isbnData = parseIsbn seed.isbn

  unless isbnData? then return error_.reject 'invalid isbn', 400, seed

  _.extend seed, isbnData

  createEditionEntity seed, scaffoldWorkEntityFromSeed(seed)

createEditionEntity = (seed, workPromise)->
  # The title is set hereafter as monolingual title (wdt:P1476)
  # instead of as a label
  labels = {}
  claims =
    'wdt:P31': [ 'wd:Q3331189' ]
    'wdt:P212': [ seed.isbn13h ]
    # wdt:P957 and wdt:P407 will be inferred from 'wdt:P212'

  addClaimIfValid claims, 'wdt:P1476', seed.title
  addClaimIfValid claims, 'wdt:P18', seed.image
  addClaimIfValid claims, 'wdt:P577', seed.publicationDate
  addClaimIfValid claims, 'wdt:P1104', seed.numberOfPages

  workPromise
  .then (work)->
    workUri = work.uri or "inv:#{work._id}"
    claims['wdt:P629'] = [ workUri ]
    return createEntity labels, claims, seedUserId
  .then _.Log('created edition entity')
  .catch _.ErrorRethrow('createEditionEntity err')

addClaimIfValid = (claims, property, value)->
  if value? and validatePropertyValueSync property, value
    claims[property] = [ value ]

  return

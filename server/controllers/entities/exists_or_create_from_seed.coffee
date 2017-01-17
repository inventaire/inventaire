# An endpoint to take advantage of data we are given thourgh data imports
# instead of relying on dataseed

CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
{ Track } = __.require 'lib', 'track'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
isbn_ = __.require 'lib', 'isbn/isbn'
entities_ = require './lib/entities'
scaffoldEntityFromSeed = require './lib/scaffold_entity_from_seed'
{ enabled:dataseedEnabled } = CONFIG.dataseed
dataseed = __.require 'data', 'dataseed/dataseed'
formatEditionEntity = require './lib/format_edition_entity'

module.exports = (req, res)->
  { body:seed } = req
  { isbn, title, authors } = seed

  unless isbn_.isValidIsbn isbn
    return error_.bundle req, res, 'invalid isbn', 400, seed

  unless _.isNonEmptyString title
    return error_.bundle req, res, 'invalid title', 400, seed

  unless _.isNonEmptyString authors
    return error_.bundle req, res, 'invalid authors', 400, seed

  seed.authors = authors
    .split ','
    .map (author)-> author.trim()

  entities_.byIsbn isbn
  .then (entityDoc)->
    if entityDoc then return entityDoc
    else return addImage(seed).then scaffoldEntityFromSeed
  .then formatEditionEntity
  .then res.json.bind(res)
  .catch error_.Handler(req, res)

addImage = (seed)->
  unless dataseedEnabled then return promises_.resolve seed

  dataseed.getImageByIsbn seed.isbn
  .then (res)->
    seed.image = res.url
    return seed

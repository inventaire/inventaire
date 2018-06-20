# An endpoint to take advantage of data we are given thourgh data imports
# instead of relying on dataseed

CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
{ Track } = __.require 'lib', 'track'
promises_ = __.require 'lib', 'promises'
responses_ = __.require 'lib', 'responses'
error_ = __.require 'lib', 'error/error'
isbn_ = __.require 'lib', 'isbn/isbn'
entities_ = require './lib/entities'
scaffoldEditionEntityFromSeed = require './lib/scaffold_entity_from_seed/edition'
{ enabled:dataseedEnabled } = CONFIG.dataseed
dataseed = __.require 'data', 'dataseed/dataseed'
formatEditionEntity = require './lib/format_edition_entity'

module.exports = (req, res)->
  { body:seed } = req
  { isbn, title, authors } = seed

  unless isbn_.isValidIsbn isbn
    return error_.bundleInvalid req, res, 'isbn', isbn

  unless _.isNonEmptyString title
    return error_.bundleInvalid req, res, 'title', title

  # Let it be splitted as a string
  if _.isArray(authors) and authors.length is 1 then authors = authors[0]

  if _.isString authors
    # Convert authors provided as strings as an array of strings
    seed.authors = authors.split(/(,|&|\set\s|\sand\s)/).map (author)-> author.trim()

  seed.authors or= []
  seed.authors = seed.authors.filter (author)-> author?.length > 0

  entities_.byIsbn isbn
  .then (entityDoc)->
    if entityDoc then return entityDoc
    else return addImage(seed).then scaffoldEditionEntityFromSeed
  .then formatEditionEntity
  .then responses_.Send(res)
  .catch error_.Handler(req, res)

addImage = (seed)->
  unless dataseedEnabled then return promises_.resolve seed

  # Try to find an image from the seed ISBN
  dataseed.getImageByIsbn seed.isbn
  .then (res)->
    if res.url
      seed.image = res.url
      return seed
    else
      { image } = seed
      unless image? then return seed

      # Else, if an image was provided in the seed, try to use it
      dataseed.getImageByUrl seed.image
      .then (res2)->
        if res.url then seed.image = res2.url
        else delete seed.image
        return seed

  .catch (err)->
    _.error err, 'add image err'
    return seed

CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
uuid = require 'simple-uuid'
tests = require './tests/common-tests'
books_ = __.require 'lib', 'books'

exports.create = (entitiesData, creatorId)->
  { title, authors, isbn, pictures } = entitiesData
  _.log entitiesData, 'create entity'

  unless title? then throw error_.new 'entity miss a title', 400

  if authors? then tests.types 'authors', authors, 'strings...'

  if isbn?
    unless books_.isIsbn isbn then throw error_.new 'invalid isbn', 400

  if pictures?
    tests.type 'picture', pictures, 'array'
    unless _.all pictures, tests.imgUrl then throw error_.new 'invalid pictures', 400

  action =
    user: creatorId
    action: 'creation'
    timestamp: _.now()

  return entityData =
    _id: uuid()
    title: title
    authors: authors
    pictures: pictures
    isbn: isbn
    history: [ action ]

# keep in sync the users database and the geo index
CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
follow = __.require 'lib', 'follow'

module.exports = (db, reset)->

  filter = (doc, req)->
    if doc.type is 'user'
      if doc.position? then return true

    return false

  onChange = (change)->
    { id, deleted, doc } = change
    _.log id, 'user change'
    { position } = doc

    if deleted then return db.del id
    else
      [ lat, lon ] = position
      # Most of the user doc change wont imply a position change
      # so it should make sense to get the doc to check the need to write
      db.getByKey id
      .catch (err)-> if err.notFound then return null else throw err
      .then updateIfNeeded.bind(null, id, lat, lon)
      .catch _.Error('user geo onChange err')

  updateIfNeeded = (id, lat, lon, res)->
    if res?
      { position } = res
      if lat is position.lat and lon is position.lon then return

    db.put { lat: lat, lon: lon }, id, null
    .then ->
      _.success [id, lat, lon], 'user position updated'
      return

  follow
    dbBaseName: 'users'
    filter: filter
    onChange: onChange
    reset: reset

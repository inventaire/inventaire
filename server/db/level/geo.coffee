CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
assert_ = __.require 'utils', 'assert_types'
{ rawSubDb, Reset, streamPromise } = require './base'
geo = require 'level-geospatial'
promises_ = __.require 'lib', 'promises'

module.exports = (dbName)->
  sub = rawSubDb dbName
  db = geo sub
  API = promises_.promisify db, [ 'get', 'getByKey', 'put', 'del' ]
  API.reset = Reset sub
  API.search = Search db

  return API

Search = (db)-> (latLng, kmRange)->
  assert_.types [ 'array', 'number' ], arguments
  [ lat, lon ] = latLng
  streamPromise db.search({ lat, lon }, kmRange * 1000)

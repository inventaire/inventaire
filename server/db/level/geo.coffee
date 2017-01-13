CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
levelBase = __.require 'level', 'base'
geo = require 'level-geospatial'
promises_ = __.require 'lib', 'promises'

module.exports = (dbName)->
  sub = levelBase.sub dbName
  db = geo sub
  API = promises_.promisify db, ['get', 'getByKey', 'put', 'del']
  API.reset = Reset sub
  API.inspect = Inspect sub
  API.search = Search db

  return API


Reset = (sub)->
  reset = ->
    new Promise (resolve, reject)->
      ops = []
      sub.createKeyStream()
      .on 'data', (key)-> ops.push {type: 'del', key: key}
      .on 'end', ->
        sub.batch ops, (err, res)->
          if err then reject err
          else resolve res

Inspect = (sub)->
  inspect = ->
    streamPromise sub.createKeyStream()

Search = (db)->
  search = (latLng, kmRange)->
    _.types arguments, ['array', 'number']
    [ lat, lon ] = latLng
    streamPromise db.search({lat: lat, lon: lon}, kmRange*1000)

streamPromise = (stream)->
  new Promise (resolve, reject)->
    results = []
    stream
    .on 'data', results.push.bind(results)
    .on 'end', -> resolve results
    .on 'error', reject

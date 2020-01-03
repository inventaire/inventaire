const CONFIG = require('config')
const __ = CONFIG.universalPath
const assert_ = __.require('utils', 'assert_types')
const getSubDb = __.require('level', 'get_sub_db')
const { streamPromise } = require('./utils')
const levelGeospatial = require('level-geospatial')
const memoize = __.require('lib', 'utils/memoize')

module.exports = memoize(dbName => {
  const sub = getSubDb(dbName, 'utf8')
  const geo = levelGeospatial(sub)
  geo.searchStream = geo.search
  geo.search = Search(geo)
  geo.sub = sub
  return geo
})

const Search = geo => (latLng, kmRange) => {
  assert_.array(latLng)
  assert_.number(kmRange)
  const [ lat, lon ] = latLng
  return streamPromise(geo.searchStream({ lat, lon }, kmRange * 1000))
}

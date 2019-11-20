// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const couch_ = __.require('lib', 'couch')
const assert_ = __.require('utils', 'assert_types')

module.exports = (db, designDoc) => bbox => {
  assert_.numbers(bbox)
  const keys = getGeoSquareKeys(bbox)

  return db.viewKeys(designDoc, 'byGeoSquare', keys, { include_docs: true })
  .then(couch_.mapDoc)
}

const getGeoSquareKeys = bbox => {
  // Using the same bbox order as Leaflet bounds.toBBoxString function.
  // Use Math.floor and not Math.trunc as they have different behaviors
  // on negative numbers: Math.floor(-2.512) => -3 /// Math.trunc(-2.512) => -2
  const [ minLng, minLat, maxLng, maxLat ] = bbox.map(Math.floor)

  const latRange = _.range(minLat, maxLat + 1)
  const lngRange = _.range(minLng, maxLng + 1)

  // Keep keys format in sync with Couchdb byGeoSquare views
  return _.combinations(latRange, lngRange)
}

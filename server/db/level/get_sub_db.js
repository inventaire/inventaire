const memoize = require('lib/utils/memoize')
const assert_ = require('lib/utils/assert_types')
const sub = require('subleveldown')
const { generalDb } = require('./get_db')

// Available encodings: https://github.com/Level/codec#builtin-encodings
module.exports = memoize((dbName, valueEncoding) => {
  assert_.string(dbName)
  assert_.string(valueEncoding)
  return sub(generalDb, dbName, { valueEncoding })
})

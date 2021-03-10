const __ = require('config').universalPath
const _ = require('builders/utils')
const isbn_ = require('lib/isbn/isbn')
const error_ = require('lib/error/error')
const dataseed = require('data/dataseed/dataseed')

// An endpoint to get basic facts from an ISBN
// Returns a merge of isbn3 and dataseed data
module.exports = (req, res) => {
  const { isbn } = req.query

  if (!_.isNonEmptyString(isbn)) {
    return error_.bundleMissingQuery(req, res, 'isbn')
  }

  const data = isbn_.parse(isbn)

  if (data == null) {
    return error_.bundleInvalid(req, res, 'isbn', isbn)
  }

  // Not using source to pass the original input as 'source'
  // has another meaning in entities search
  delete data.source
  data.query = isbn

  const refresh = _.parseBooleanString(req.query.refresh)

  return dataseed.getByIsbns(data.isbn13, refresh)
  .then(resp => {
    const seed = resp[0] || {}
    delete seed.isbn
    Object.assign(data, seed)
    res.json(data)
  })
  .catch(error_.Handler(req, res))
}

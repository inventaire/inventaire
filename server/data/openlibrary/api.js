// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
const coverBase = 'http://covers.openlibrary.org'

module.exports =
  { coverByOlId(olId, type = 'b'){ return `${coverBase}/${type}/olid/${olId}.jpg` } }

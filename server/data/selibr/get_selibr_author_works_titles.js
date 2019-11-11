// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const fetchExternalAuthorWorksTitles = __.require('data', 'lib/fetch_external_author_works_titles')

const endpoint = 'http://libris.kb.se/sparql'

const getQuery = selibrId => `\
SELECT ?work ?title {
?work <http://purl.org/dc/elements/1.1/creator> <http://libris.kb.se/resource/auth/${selibrId}> .
?work <http://purl.org/dc/elements/1.1/title> ?title .
}\
`

module.exports = fetchExternalAuthorWorksTitles('selibr', endpoint, getQuery)

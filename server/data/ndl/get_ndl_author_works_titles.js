/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const fetchExternalAuthorWorksTitles = __.require('data', 'lib/fetch_external_author_works_titles');

const endpoint = 'https://jpsearch.go.jp/rdf/sparql';

const getQuery = ndlId => `\
SELECT * WHERE {
?work <http://schema.org/creator> <http://id.ndl.go.jp/auth/entity/${ndlId}> .
?work <http://schema.org/name> ?title .
}\
`;

module.exports = fetchExternalAuthorWorksTitles('ndl', endpoint, getQuery);

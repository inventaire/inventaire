/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const fetchExternalAuthorWorksTitles = __.require('data', 'lib/fetch_external_author_works_titles');

const endpoint = 'http://data.bibliotheken.nl/sparql';

const getQuery = kjkId => `\
SELECT ?work ?title WHERE {
?work <http://schema.org/author> <http://data.bibliotheken.nl/id/thes/p${kjkId}> .
?work <http://schema.org/name> ?title .
}\
`;

module.exports = fetchExternalAuthorWorksTitles('kjk', endpoint, getQuery);

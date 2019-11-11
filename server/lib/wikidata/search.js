/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath;
const _ = __.require('builders', 'utils');
const base = 'https://www.wikidata.org/w/api.php';

module.exports = (search, limit = '25', format = 'json') => _.buildPath(base, {
  action: 'query',
  list: 'search',
  srlimit: limit,
  format,
  srsearch: search,
  origin: '*'
}
);

/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const { Promise } = __.require('lib', 'promises');
const resolveWorksFromEdition = require('./resolve_works_from_edition');
const resolveAuthorsFromWorks = require('./resolve_authors_from_works');
const resolveWorksFromAuthors = require('./resolve_works_from_authors');

// Resolve a work(or author) seed when the author(or work) seed is already resolved

module.exports = function(entry){
  const { authors, works, edition } = entry;

  if (!_.some(works)) { return entry; }

  return resolveWorksFromEdition(works, edition)
  .then(function(works){
    entry.works = works;
    return resolveAuthorsFromWorks(authors, works)
    .then(authors => entry.authors = authors)
    .then(() => resolveWorksFromAuthors(works, authors));}).then(works => entry.works = works)
  .then(() => entry);
};

const hasAuthorClaims = work => work.claims['wdt:P50'] != null;

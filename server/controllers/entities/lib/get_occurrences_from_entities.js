/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath;
const _ = __.require('builders', 'utils');
const getAuthorWorks = __.require('controllers', 'entities/lib/get_author_works');
const getEntitiesList = __.require('controllers', 'entities/lib/get_entities_list');
const { getEntityNormalizedTerms } = require('./terms_normalization');

module.exports = (uri, suspectWorksLabels) => getAuthorWorks({ uri })
.then(getSuggestionWorks)
.then(function(suggestionWorksData){
  const occurrences = [];
  for (let sugWork of suggestionWorksData) {
    const sugWorkTerms = getEntityNormalizedTerms(sugWork);
    const matchedTitles = _.intersection(suspectWorksLabels, sugWorkTerms);
    if (matchedTitles.length > 0) {
      ({ uri } = sugWork);
      occurrences.push({ uri, matchedTitles, structuredDataSource: true });
    }
  }
  return occurrences;
});

var getSuggestionWorks = function(res){
  const uris = res.works.map(_.property('uri'));
  return getEntitiesList(uris);
};

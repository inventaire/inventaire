/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// A module to look for works labels occurrences in an author's external databases reference.

const __ = require('config').universalPath;
const _ = __.require('builders', 'utils');
const promises_ = __.require('lib', 'promises');
const error_ = __.require('lib', 'error/error');
const assert_ = __.require('utils', 'assert_types');
const getWikipediaArticle = __.require('data', 'wikipedia/get_article');
const getBnfAuthorWorksTitles = __.require('data', 'bnf/get_bnf_author_works_titles');
const getBnbAuthorWorksTitles = __.require('data', 'bnb/get_bnb_author_works_titles');
const getBneAuthorWorksTitles = __.require('data', 'bne/get_bne_author_works_titles');
const getSelibrAuthorWorksTitle = __.require('data', 'selibr/get_selibr_author_works_titles');
const getKjkAuthorWorksTitle = __.require('data', 'kjk/get_kjk_author_works_titles');
const getNdlAuthorWorksTitle = __.require('data', 'ndl/get_ndl_author_works_titles');
const getOlAuthorWorksTitles = __.require('data', 'openlibrary/get_ol_author_works_titles');
const getEntityByUri = require('./get_entity_by_uri');
const { normalizeTerm } = require('./terms_normalization');

// - worksLabels: labels from works of an author suspected
//   to be the same as the wdAuthorUri author
// - worksLabelsLangs: those labels language, indicating which Wikipedia editions
//   should be checked
module.exports = function(wdAuthorUri, worksLabels, worksLabelsLangs){
  assert_.string(wdAuthorUri);
  assert_.strings(worksLabels);
  assert_.strings(worksLabelsLangs);

  // get Wikipedia article title from URI
  return getEntityByUri({ uri: wdAuthorUri })
  .then(function(authorEntity){
    // Known case: entities tagged as 'missing' or 'meta'
    if (authorEntity.sitelinks == null) { return []; }

    return promises_.all([
      getWikipediaOccurrences(authorEntity, worksLabels, worksLabelsLangs),
      getBnfOccurrences(authorEntity, worksLabels),
      getOpenLibraryOccurrences(authorEntity, worksLabels),
      getBnbOccurrences(authorEntity, worksLabels),
      getBneOccurrences(authorEntity, worksLabels),
      getSelibrOccurrences(authorEntity, worksLabels),
      getKjkOccurrences(authorEntity, worksLabels),
      getNdlOccurrences(authorEntity, worksLabels)
    ]);})
  .then(_.flatten)
  .then(_.compact)
  .catch(function(err){
    _.error(err, 'has works labels occurrence err');
    return [];});
};

var getWikipediaOccurrences = (authorEntity, worksLabels, worksLabelsLangs) => promises_.all(getMostRelevantWikipediaArticles(authorEntity, worksLabelsLangs))
.map(createOccurrencesFromUnstructuredArticle(worksLabels));

var getMostRelevantWikipediaArticles = function(authorEntity, worksLabelsLangs){
  const { sitelinks, originalLang } = authorEntity;

  return _.uniq(worksLabelsLangs.concat([ originalLang, 'en' ]))
  .map(function(lang){
    const title = sitelinks[`${lang}wiki`];
    if (title != null) { return { lang, title }; }})
  .filter(_.identity)
  .map(getWikipediaArticle);
};

const getAndCreateOccurrencesFromIds = (prop, getWorkTitlesFn) => (function(authorEntity, worksLabels) {
  // An author should normally have only 1 value per external id property
  // but if there are several, check every available ids
  const ids = authorEntity.claims[prop];
  if (ids == null) { return; }
  return promises_.all(ids.map(getWorkTitlesFn))
  .then(_.flatten)
  .map(createOccurrencesFromExactTitles(worksLabels));
});

var getBnfOccurrences = getAndCreateOccurrencesFromIds('wdt:P268', getBnfAuthorWorksTitles);
var getOpenLibraryOccurrences = getAndCreateOccurrencesFromIds('wdt:P648', getOlAuthorWorksTitles);
var getBnbOccurrences = getAndCreateOccurrencesFromIds('wdt:P5361', getBnbAuthorWorksTitles);
var getBneOccurrences = getAndCreateOccurrencesFromIds('wdt:P950', getBneAuthorWorksTitles);
var getSelibrOccurrences = getAndCreateOccurrencesFromIds('wdt:P906', getSelibrAuthorWorksTitle);
var getKjkOccurrences = getAndCreateOccurrencesFromIds('wdt:P1006', getKjkAuthorWorksTitle);
var getNdlOccurrences = getAndCreateOccurrencesFromIds('wdt:P349', getNdlAuthorWorksTitle);

var createOccurrencesFromUnstructuredArticle = function(worksLabels){
  const worksLabelsPattern = new RegExp(worksLabels.join('|'), 'gi');
  return function(article){
    const matchedTitles = _.uniq(article.extract.match(worksLabelsPattern));
    if (matchedTitles.length <= 0) { return; }
    return { url: article.url, matchedTitles, structuredDataSource: false };
  };
};

var createOccurrencesFromExactTitles = worksLabels => (function(result) {
  const title = normalizeTerm(result.title);
  if (worksLabels.includes(title)) {
    return { url: result.url, matchedTitles: [ title ], structuredDataSource: true };
  } else {
    return;
  }
});

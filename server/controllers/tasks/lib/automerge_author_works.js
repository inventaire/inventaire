/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath;
const _ = __.require('builders', 'utils');
const mergeEntities = __.require('controllers', 'entities/lib/merge_entities');
const getAuthorWorks = __.require('controllers', 'entities/lib/get_author_works');
const getEntitiesList = __.require('controllers', 'entities/lib/get_entities_list');
const { getEntityNormalizedTerms } = __.require('controllers', 'entities/lib/terms_normalization');
const { _id: reconcilerUserId } = __.require('couch', 'hard_coded_documents').users.reconciler;

module.exports = authorUri => getAuthorWorksByDomain(authorUri)
.then(findMergeableWorks)
.then(automergeWorks(authorUri));

var getAuthorWorksByDomain = authorUri => getAuthorWorks({ uri: authorUri })
.get('works')
.then(function(works){
  const uris = _.map(works, _.property('uri'));
  return getEntitiesList(uris);
});

var findMergeableWorks = function(works){
  let { wd: wdWorks, inv: invWorks } = works
    .reduce(spreadWorksPerDomain, { wd: [], inv: [] });
  invWorks = invWorks.filter(isntSeriePart);
  return getPossibleWorksMerge(wdWorks, invWorks);
};

var spreadWorksPerDomain = function(lists, work){
  const prefix = work.uri.split(':')[0];
  lists[prefix].push(work);
  return lists;
};

var isntSeriePart = work => work.claims['wdt:P179'] == null;

var getPossibleWorksMerge = function(wdWorks, invWorks){
  wdWorks = wdWorks.map(addNormalizedTerms);
  invWorks = invWorks.map(addNormalizedTerms);
  return _.compact(invWorks.map(findPossibleMerge(wdWorks)));
};

var addNormalizedTerms = function(work){
  work.terms = getEntityNormalizedTerms(work);
  return work;
};

var findPossibleMerge = wdWorks => (function(invWork) {
  const matches = wdWorks.filter(haveSomeMatchingTerms(invWork));
  if (matches.length === 1) { return [ invWork.uri, matches[0].uri ]; }
});

var haveSomeMatchingTerms = invWork => wdWork => _.someMatch(invWork.terms, wdWork.terms);

var automergeWorks = authorUri => (function(mergeableCouples) {
  if (mergeableCouples.length === 0) { return; }

  _.log(mergeableCouples, `automerging works from author ${authorUri}`);

  var mergeNext = function() {
    const nextCouple = mergeableCouples.pop();
    if (nextCouple == null) { return; }
    return mergeEntities(reconcilerUserId, ...Array.from(nextCouple))
    .then(mergeNext);
  };

  return mergeNext();
});

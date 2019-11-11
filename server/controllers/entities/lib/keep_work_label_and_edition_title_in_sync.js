/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath;
const _ = __.require('builders', 'utils');
const entities_ = require('./entities');
const getOriginalLang = __.require('lib', 'wikidata/get_original_lang');
const { _id:hookUserId } = __.require('couch', 'hard_coded_documents').users.hook;
const updateLabel = require('./update_label');

// TODO: also check for edition subtitle

module.exports = function(edition, oldTitle){
  const workUris = edition.claims['wdt:P629'];
  // Ignore composite editions
  if (workUris.length !== 1) { return; }
  const workUri = workUris[0];
  const editionLang = getOriginalLang(edition.claims);

  if (editionLang == null) {
    _.warn(edition._id, "couldn't apply hook: edition miss a lang");
    return;
  }

  const [ prefix, id ] = Array.from(workUri.split(':'));
  // local work entity all have an 'inv' prefix
  if (prefix !== 'inv') { return; }

  // Check the opinion from other editions of this lang
  return fetchLangConsensusTitle(workUri, editionLang)
  .then(function(consensusEditionTitle){
    if (!_.isNonEmptyString(consensusEditionTitle)) { return; }
    return entities_.byId(id)
    .then(updateWorkLabel(editionLang, oldTitle, consensusEditionTitle));}).catch(_.Error('hook update err'));
};

var fetchLangConsensusTitle = (workUri, editionLang) => entities_.byClaim('wdt:P629', workUri, true, true)
.filter(edition => getOriginalLang(edition.claims) === editionLang)
.map(edition => edition.claims['wdt:P1476'][0])
.then(function(titles){
  const differentTitles = _.uniq(titles);
  if (differentTitles.length === 1) { return differentTitles[0];
  } else { return null; }
});

var updateWorkLabel = (editionLang, oldTitle, consensusEditionTitle) => (function(workDoc) {
  const currentEditionLangLabel = workDoc.labels[editionLang];
  const workLabelAndEditionTitleSynced = oldTitle === currentEditionLangLabel;
  const noWorkLabel = (currentEditionLangLabel == null);
  if (noWorkLabel || workLabelAndEditionTitleSynced) {
    _.info([ workDoc._id, editionLang, consensusEditionTitle ], 'hook update');
    return updateLabel(editionLang, consensusEditionTitle, hookUserId, workDoc);
  }
});

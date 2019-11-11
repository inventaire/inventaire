/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath;
const _ = __.require('builders', 'utils');
const { Promise } = __.require('lib', 'promises');
const entities_ = require('./entities');
const updateInvClaim = require('./update_inv_claim');
const placeholders_ = require('./placeholders');
const { unprefixify } = __.require('controllers', 'entities/lib/prefix');

module.exports = function(user, uris){
  const reqUserId = user._id;

  // Removing sequentially to avoid edit conflicts if entities or items
  // are concerned by several of the deleted entities.
  // This makes it a potentially slow operation, which is OK, as it's an admin task
  var removeNext = function() {
    const uri = uris.pop();
    if (uri == null) { return; }

    const id = unprefixify(uri);

    _.warn(uri, 'removing entity');

    return tolerantRemove(reqUserId, id)
    .then(() => deleteUriValueClaims(user, uri))
    .delay(100)
    .then(removeNext);
  };

  return removeNext();
};

var tolerantRemove = (reqUserId, id) => // Turning deleted entities into removed:placeholder as it as largely the same effect
// as deleting (not indexed by views any more) but it's reversible, and already
// understood by other services, that will either unindex it (search engine updater)
// or ignore it (client)
placeholders_.remove(reqUserId, id)
.catch(function(err){
  // If the entity was already turned into a removed:placeholder
  // there is no new change and this operation produces and 'empty patch' error
  // that we can ignore, as it's simply already in the desired state
  if (err.message === 'empty patch') {
    _.warn(id, 'this entity is already a removed:placeholder: ignored');
    return;
  } else {
    throw err;
  }
});

var deleteUriValueClaims = (user, uri) => entities_.byClaimsValue(uri)
.then(removeClaimsSequentially(user, uri));

var removeClaimsSequentially = (user, uri) => (function(claimsData) {
  var removeNextClaim = function() {
    const claimData = claimsData.pop();
    if (claimData == null) { return; }
    _.warn(claimData, `removing claims with value: ${uri}`);
    return removeClaim(user, uri, claimData)
    .delay(100)
    .then(removeNextClaim);
  };

  return removeNextClaim();
});

var removeClaim = function(user, uri, claimData){
  const { entity:id, property } = claimData;
  return updateInvClaim(user, id, property, uri, null);
};

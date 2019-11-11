/*
 * decaffeinate suggestions:
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath;
const _ = __.require('builders', 'utils');
const { getAvatarsUrlsFromClaims } = require('./get_avatars_from_claims');
const getCommonsFilenamesFromClaims = require('./get_commons_filenames_from_claims');
const { getUrlFromEntityImageHash } = require('./entities');

module.exports = function(entity){
  const { claims } = entity;
  // Test claims existance to prevent crash when used on meta entities
  // for which entities claims were deleted
  if (claims == null) { return []; }

  const invImageUrl = getUrlFromEntityImageHash(claims['invp:P2'] != null ? claims['invp:P2'][0] : undefined);
  const invImageUrls = (invImageUrl != null) ? [ invImageUrl ] : [];
  const claimsImages = getCommonsFilenamesFromClaims(claims);
  const avatarsImages = getAvatarsUrlsFromClaims(claims);

  return invImageUrls.concat(claimsImages, avatarsImages);
};

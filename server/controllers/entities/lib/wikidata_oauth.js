// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const { wikidataOAuth } = CONFIG

module.exports = {
  validate: user => {
    const userWikidataOAuth = user.oauth != null ? user.oauth.wikidata : undefined
    if (userWikidataOAuth == null) {
      throw error_.new('missing wikidata oauth tokens', 400)
    }
  },

  getFullCredentials: user => _.extend({}, wikidataOAuth, user.oauth.wikidata)
}

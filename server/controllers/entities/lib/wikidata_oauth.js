const error_ = require('lib/error/error')
const { wikidataOAuth } = require('config')

module.exports = {
  validate: user => {
    const userWikidataOAuth = user.oauth != null ? user.oauth.wikidata : undefined
    if (userWikidataOAuth == null) {
      throw error_.new('missing wikidata oauth tokens', 400)
    }
  },

  getOauthCredentials: user => ({
    oauth: Object.assign({}, wikidataOAuth, user.oauth.wikidata)
  })
}

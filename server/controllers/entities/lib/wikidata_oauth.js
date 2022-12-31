import error_ from 'lib/error/error'
import { wikidataOAuth } from 'config'

export default {
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

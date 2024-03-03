import CONFIG from 'config'
import { newError } from '#lib/error/error'

const { wikidataOAuth } = CONFIG

export function validateWikidataOAuth (user) {
  const userWikidataOAuth = user.oauth != null ? user.oauth.wikidata : undefined
  if (userWikidataOAuth == null) {
    throw newError('missing wikidata oauth tokens', 400)
  }
}

export const getWikidataOAuthCredentials = user => ({
  oauth: Object.assign({}, wikidataOAuth, user.oauth.wikidata),
})

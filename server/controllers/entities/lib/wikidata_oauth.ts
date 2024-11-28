import { newError } from '#lib/error/error'
import config from '#server/config'
import type { SpecialUser, User } from '#types/user'

const { wikidataOAuth, botAccountWikidataOAuth } = config

export function validateWikidataOAuth (user: User | SpecialUser) {
  if ('special' in user) return
  const userWikidataOAuth = user.oauth != null ? user.oauth.wikidata : undefined
  if (userWikidataOAuth == null) {
    throw newError('missing wikidata oauth tokens', 400)
  }
}

export function getWikidataOAuthCredentials (user: User | SpecialUser) {
  if ('special' in user) {
    return {
      oauth: botAccountWikidataOAuth,
    }
  } else {
    return {
      oauth: { ...wikidataOAuth, ...user.oauth.wikidata },
    }
  }
}

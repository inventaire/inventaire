import { newError } from '#lib/error/error'
import config from '#server/config'
import type { SpecialUser, User } from '#types/user'

const { wikidataOAuth, botAccountWikidataOAuth } = config

export function hasWikidataOAuth (user: User | SpecialUser) {
  if (user.type === 'special') return true
  const userWikidataOAuth = user.oauth != null ? user.oauth.wikidata : undefined
  return userWikidataOAuth != null
}

export function validateWikidataOAuth (user: User | SpecialUser) {
  if (!hasWikidataOAuth(user)) {
    throw newError('missing wikidata oauth tokens', 400)
  }
}

export function getWikidataOAuthCredentials (user: User | SpecialUser) {
  if (user.type === 'special') {
    return {
      oauth: botAccountWikidataOAuth,
    }
  } else {
    return {
      oauth: { ...wikidataOAuth, ...user.oauth.wikidata },
    }
  }
}

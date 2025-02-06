import { newError } from '#lib/error/error'
import type { MinimalRemoteUser, UserWithAcct } from '#lib/federation/remote_user'
import { getUserAcct } from '#lib/federation/remote_user'
import config from '#server/config'
import type { SpecialUser, User } from '#types/user'

const { wikidataOAuth, botAccountWikidataOAuth } = config

export function hasWikidataOAuth (user: User | SpecialUser | MinimalRemoteUser | UserWithAcct) {
  if ('type' in user && user.type === 'special') return true
  return 'oauth' in user && 'wikidata' in user.oauth && user.oauth.wikidata != null
}

export function validateUserHasWikidataOAuth (user: User | SpecialUser | MinimalRemoteUser | UserWithAcct) {
  if (!hasWikidataOAuth(user)) {
    throw newError('missing wikidata oauth tokens', 400)
  }
}

export function getWikidataOAuthCredentials (user: User | SpecialUser | MinimalRemoteUser | UserWithAcct) {
  if ('type' in user && user.type === 'special') {
    return {
      hasOwnOAuth: true,
      credentials: { oauth: botAccountWikidataOAuth },
    }
  } else if (('oauth' in user && 'wikidata' in user.oauth)) {
    return {
      hasOwnOAuth: true,
      credentials: { oauth: { ...wikidataOAuth, ...user.oauth.wikidata } },
    }
  } else {
    return {
      hasOwnOAuth: false,
      credentials: { oauth: botAccountWikidataOAuth },
      summarySuffix: `Edit on behalf of acct:${getUserAcct(user)}`,
    }
  }
}

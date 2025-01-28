import { getRandomBytes } from '#lib/crypto'
import config, { publicOrigin } from '#server/config'

export const randomActivityId = (customOrigin = publicOrigin) => `${customOrigin}/${getRandomBytes(20, 'hex')}`

export function randomActivity ({ externalId, emitterActorUrl, activityObject, type }) {
  if (!externalId) externalId = randomActivityId(config.publicHost)
  return {
    '@context': [ 'https://www.w3.org/ns/activitystreams' ],
    id: externalId,
    type: type || 'Follow',
    actor: emitterActorUrl,
    object: activityObject,
  }
}

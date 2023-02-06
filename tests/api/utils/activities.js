import CONFIG from 'config'
import { getRandomBytes } from '#lib/crypto'

const origin = CONFIG.getPublicOrigin()

export const randomActivityId = (customOrigin = origin) => `${customOrigin}/${getRandomBytes(20, 'hex')}`

export const randomActivity = ({ externalId, emitterActorUrl, activityObject, type }) => {
  if (!externalId) externalId = randomActivityId(CONFIG.publicHost)
  return {
    '@context': [ 'https://www.w3.org/ns/activitystreams' ],
    id: externalId,
    type: type || 'Follow',
    actor: emitterActorUrl,
    object: activityObject,
  }
}

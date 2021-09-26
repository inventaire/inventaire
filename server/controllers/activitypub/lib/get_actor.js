const CONFIG = require('config')
const error_ = require('lib/error/error')
const user_ = require('controllers/user/lib/user')
const { isEntityUri, isUsername, isCouchUuid } = require('lib/boolean_validations')
const getEntityByUri = require('controllers/entities/lib/get_entity_by_uri')
const { getSharedKeyPair } = require('./shared_key_pair')
const shelves_ = require('controllers/shelves/lib/shelves')

const host = CONFIG.fullPublicHost()

module.exports = name => {
  if (isEntityUri(name)) {
    return getEntityActor(name)
  } else if (name.startsWith('shelf:')) {
    return getShelfActor(name)
  } else if (isUsername(name)) {
    return getUserActor(name)
  } else {
    throw error_.notFound({ name })
  }
}

const getShelfActor = async name => {
  const id = name.split(':')[1]
  if (!isCouchUuid(id)) throw error_.new('invalid shelf id', 400, { id })
  const shelf = await shelves_.byId(id)
  if (!shelf || shelf.listing !== 'public') throw error_.notFound({ name })
  const owner = await user_.byId(shelf.owner)
  if (!owner) throw error_.notFound({ username: name })
  if (!owner.fediversable) throw error_.new("shelf's owner is not on the fediverse", 404, { username: name })

  const { description } = shelf
  return buildActorObject({
    name,
    preferredUsername: name,
    summary: description
  })
}

const getUserActor = async requestedUsername => {
  const user = await user_.findOneByUsername(requestedUsername)
  if (!user || !user.fediversable) throw error_.notFound({ requestedUsername })
  const { picture, stableUsername, bio } = user
  return buildActorObject({
    name: stableUsername,
    preferredUsername: stableUsername,
    summary: bio,
    imagePath: picture,
  })
}

const getEntityActor = async uri => {
  const entity = await getEntityByUri({ uri })
  const label = entity.labels.en || Object.values(entity.labels)[0] || entity.claims['wdt:P1476']?.[0]
  return buildActorObject({
    name: uri,
    preferredUsername: label,
    imagePath: entity.image.url
  })
}

const buildActorObject = async ({ name, preferredUsername, summary, imagePath }) => {
  const actorUrl = `${host}/api/activitypub?action=actor&name=${name}`
  const actor = {
    '@context': [
      'https://www.w3.org/ns/activitystreams',
      'https://w3id.org/security/v1'
    ],
    type: 'Person',
    id: actorUrl,
    preferredUsername,
    summary,
    inbox: `${host}/api/activitypub?action=inbox&name=${name}`,
    outbox: `${host}/api/activitypub?action=outbox&name=${name}`,
    publicKey: {
      id: `${host}/api/activitypub?action=actor&name=${name}#main-key`,
      owner: `${host}/api/activitypub?action=actor&name=${name}`
    }
  }

  if (imagePath) {
    actor.icon = {
      mediaType: 'image/jpeg',
      type: 'Image',
      url: `${host}${imagePath}`
    }
  }

  const { publicKey } = await getSharedKeyPair()

  // TODO: experiment with a shared publicKey id and owner, to invite caching system to re-use
  // shared public keys they already know
  actor.publicKey = {
    // "#" is an identifier in order to host the key in a same document as the actor URL document
    id: `${actorUrl}#main-key`,
    owner: actorUrl, // must be actor.id
    publicKeyPem: publicKey
  }

  return actor
}

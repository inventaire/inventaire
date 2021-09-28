const CONFIG = require('config')
const error_ = require('lib/error/error')
const { validateShelf, validateUser, validateEntity } = require('./validations')
const { isEntityUri, isUsername } = require('lib/boolean_validations')
const { getSharedKeyPair } = require('./shared_key_pair')
const { getEntityUriFromActorName } = require('./helpers')
const host = CONFIG.fullPublicHost()

module.exports = name => {
  if (isEntityUri(getEntityUriFromActorName(name))) {
    return getEntityActor(name)
  } else if (name.startsWith('shelf-')) {
    return getShelfActor(name)
  } else if (isUsername(name)) {
    return getUserActor(name)
  } else {
    throw error_.notFound({ name })
  }
}

const getShelfActor = async name => {
  const { shelf, owner } = await validateShelf(name)
  const { description } = shelf
  return buildActorObject({
    actorName: name,
    displayName: `${shelf.name} [${owner.username}]`,
    summary: description
  })
}

const getUserActor = async username => {
  const { user } = await validateUser(username)
  const { picture, stableUsername, bio } = user
  return buildActorObject({
    actorName: stableUsername,
    displayName: user.username,
    summary: bio,
    imagePath: picture,
  })
}

const getEntityActor = async name => {
  const { entity } = await validateEntity(name)
  const label = entity.labels.en || Object.values(entity.labels)[0] || entity.claims['wdt:P1476']?.[0]
  return buildActorObject({
    actorName: entity.actorName,
    displayName: label,
    summary: entity.descriptions?.en,
    imagePath: entity.image.url
  })
}

const buildActorObject = async ({ actorName, displayName, summary, imagePath }) => {
  const actorUrl = `${host}/api/activitypub?action=actor&name=${actorName}`
  const actor = {
    '@context': [
      'https://www.w3.org/ns/activitystreams',
      'https://w3id.org/security/v1'
    ],
    type: 'Person',
    id: actorUrl,
    name: displayName,
    preferredUsername: actorName,
    summary,
    inbox: `${host}/api/activitypub?action=inbox&name=${actorName}`,
    outbox: `${host}/api/activitypub?action=outbox&name=${actorName}`,
    publicKey: {
      id: `${host}/api/activitypub?action=actor&name=${actorName}#main-key`,
      owner: `${host}/api/activitypub?action=actor&name=${actorName}`
    }
  }

  if (imagePath) {
    actor.icon = {
      mediaType: 'image/jpeg',
      type: 'Image',
      url: imagePath.startsWith('http') ? imagePath : `${host}${imagePath}`
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

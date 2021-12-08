const CONFIG = require('config')
const _ = require('builders/utils')
const error_ = require('lib/error/error')
const { validateShelf, validateUser, validateEntity } = require('./validations')
const { isEntityUri, isUsername } = require('lib/boolean_validations')
const { getSharedKeyPair } = require('./shared_key_pair')
const { getEntityUriFromActorName } = require('./helpers')
const { unprefixify } = require('controllers/entities/lib/prefix')
const { publicHost } = CONFIG
const host = CONFIG.fullPublicHost()

module.exports = (name, returnHtml, res) => {
  const actionsByType = {
    inventory: {
      getActor: getUserActor,
      getUrlId: _.identity
    },
    shelves: {
      getActor: getShelfActor,
      getUrlId: name => name.split('-')[1]
    },
    entity: {
      getActor: getEntityActor,
      getUrlId: getEntityUriFromActorName
    }
  }
  let type
  if (isEntityUri(getEntityUriFromActorName(name))) type = 'entity'
  else if (name.startsWith('shelf-')) type = 'shelves'
  else if (isUsername(name)) type = 'inventory'
  else throw error_.notFound({ name })

  const actionType = actionsByType[type]
  if (returnHtml && type) return res.redirect(`/${type}/${actionType.getUrlId(name)}`)
  return actionType.getActor(name)
}

const getShelfActor = async name => {
  const { shelf, owner } = await validateShelf(name)
  const { description } = shelf
  const links = [ {
    name: 'shelf',
    url: `${host}/shelves/${shelf._id}`
  } ]

  return buildActorObject({
    actorName: name,
    displayName: `${shelf.name} [${owner.username}]`,
    summary: description,
    links,
  })
}

const getUserActor = async username => {
  const { user } = await validateUser(username)
  const { picture, stableUsername, bio } = user
  const links = [
    { name: 'inventory', url: `${host}/inventory/${username}` }
  ]
  return buildActorObject({
    actorName: stableUsername,
    displayName: username,
    summary: bio,
    imagePath: picture,
    links,
  })
}

const getEntityActor = async name => {
  const { entity } = await validateEntity(name)
  const label = entity.labels.en || Object.values(entity.labels)[0] || entity.claims['wdt:P1476']?.[0]
  const links = [
    { name: publicHost, url: `${host}/entity/${entity.uri}` }
  ]
  if (entity.uri.startsWith('wd:')) {
    links.push({ name: 'wikidata.org', url: `https://www.wikidata.org/wiki/${unprefixify(entity.uri)}` })
  }
  return buildActorObject({
    actorName: entity.actorName,
    displayName: label,
    summary: entity.descriptions?.en,
    imagePath: entity.image.url,
    links,
  })
}

const buildActorObject = async ({ actorName, displayName, summary, imagePath, links }) => {
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

  if (links) {
    actor.attachment = links.map(({ name, url }) => {
      const [ protocol, urlWithoutProtocol ] = url.split('://')
      return {
        type: 'PropertyValue',
        name,
        url,
        // Mimicking Mastodon
        value: `<a href="${url}" rel="me nofollow noopener noreferrer" target="_blank"><span class="invisible">${protocol}://</span><span>${urlWithoutProtocol}</span></a>`
      }
    })
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

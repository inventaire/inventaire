import { getEntityActorName } from '#controllers/activitypub/lib/helpers'
import { unprefixify } from '#controllers/entities/lib/prefix'
import config from '#server/config'
import type { Attachement, ActivityLink, ActorActivity, ActorParams, LocalActorUrl } from '#types/activity'
import type { Url } from '#types/common'
import buildAttachements from './build_attachements.js'
import { buildLink, getActorTypeFromName, defaultLabel, entityUrl } from './helpers.js'
import { getSharedKeyPair } from './shared_key_pair.js'
import { validateShelf, validateUser, validateEntity } from './validations.js'

const origin = config.getPublicOrigin()
const publicHost = origin.split('://')[1]

const getShelfActor = async name => {
  const { shelf, owner } = await validateShelf(name)
  const { description } = shelf
  const links: ActivityLink[] = [
    {
      name: 'shelf',
      url: `${origin}/shelves/${shelf._id}`,
    },
  ]
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
  const links: ActivityLink[] = [
    { name: 'inventory', url: `${origin}/users/${username}` as Url },
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
  const actorName = getEntityActorName(entity.uri)
  const { uri } = entity
  const label = defaultLabel(entity)
  const url = entityUrl(uri)
  const links: ActivityLink[] = [
    {
      name: publicHost,
      url,
    },
  ]
  if (uri.startsWith('wd:')) {
    const wdLink: ActivityLink = {
      name: 'wikidata.org',
      url: `https://www.wikidata.org/wiki/${unprefixify(uri)}`,
    }
    links.push(wdLink)
  }
  const attachments: Attachement[] = await buildAttachements(entity)
  let summary
  if ('descriptions' in entity) {
    summary = entity.descriptions.en
  }
  return buildActorObject({
    actorName,
    displayName: label,
    summary,
    imagePath: entity.image.url,
    links,
    attachment: attachments,
  })
}

const buildActorObject = async ({ actorName, displayName, summary, imagePath, links, attachment = [] }: ActorParams) => {
  const { publicKey, publicKeyHash } = await getSharedKeyPair()
  const actorUrl: LocalActorUrl = `${origin}/api/activitypub?action=actor&name=${actorName}`
  // Use the key hash to bust any cached version of an old key
  const keyUrl: LocalActorUrl = `${actorUrl}#${publicKeyHash}`

  const actor: ActorActivity = {
    '@context': [
      'https://www.w3.org/ns/activitystreams',
      'https://w3id.org/security/v1',
    ],
    type: 'Person',
    id: actorUrl,
    name: displayName,
    preferredUsername: actorName,
    summary,
    inbox: `${origin}/api/activitypub?action=inbox&name=${actorName}`,
    outbox: `${origin}/api/activitypub?action=outbox&name=${actorName}`,
    // TODO: experiment with a shared publicKey id and owner, to invite caching system to re-use
    // shared public keys they already know
    publicKey: {
      id: keyUrl,
      owner: actorUrl, // must be actor.id
      publicKeyPem: publicKey,
    },
  }

  if (imagePath) {
    const url = imagePath.startsWith('http') ? imagePath : `${origin}${imagePath}`
    actor.icon = {
      mediaType: 'image/jpeg',
      type: 'Image',
      url,
    }
  }

  if (links) {
    const linksAttachements = links.map(({ name, url }) => {
      const [ protocol, urlWithoutProtocol ] = url.split('://')
      const value = `<span class="invisible">${protocol}://</span><span>${urlWithoutProtocol}</span>`
      const attachement: Attachement = {
        type: 'PropertyValue',
        name,
        url,
        value: buildLink(url, value),
      }
      return attachement
    })
    actor.attachment = linksAttachements.concat(attachment)
  } else {
    actor.attachment = attachment
  }

  return actor
}

const getActorByType = {
  user: getUserActor,
  shelf: getShelfActor,
  entity: getEntityActor,
}

export default name => {
  const type = getActorTypeFromName(name)
  return getActorByType[type](name)
}

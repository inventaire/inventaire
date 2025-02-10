import { getEntityActorName } from '#controllers/activitypub/lib/helpers'
import { unprefixify } from '#controllers/entities/lib/prefix'
import { cache_ } from '#lib/cache'
import { requests_, sanitizeUrl } from '#lib/requests'
import { oneMonth } from '#lib/time'
import { logError } from '#lib/utils/logs'
import config, { publicOrigin } from '#server/config'
import type { PropertyValueAttachment, ActivityLink, ActorActivity, ActorParams, LocalActorUrl, ShelfActorName, EntityActorName, RemoteActor } from '#types/activity'
import type { AbsoluteUrl } from '#types/common'
import type { Username } from '#types/user'
import buildAttachments from './build_attachments.js'
import { buildLink, getActorTypeFromName, defaultLabel, entityUrl } from './helpers.js'
import { getSharedKeyPair } from './shared_key_pair.js'
import { validateShelf, validateUser, validateEntity } from './validations.js'

const host = publicOrigin.split('://')[1]

export function getActor (name) {
  const type = getActorTypeFromName(name)
  return getActorByType[type](name)
}

async function getShelfActor (name: ShelfActorName) {
  const { shelf, owner } = await validateShelf(name)
  const { description } = shelf
  const links: ActivityLink[] = [
    {
      name: 'shelf',
      url: `${publicOrigin}/shelves/${shelf._id}`,
    },
  ]
  return buildActorObject({
    actorName: name,
    displayName: `${shelf.name} [${owner.username}]`,
    summary: description,
    links,
  })
}

async function getUserActor (username: Username) {
  const { user } = await validateUser(username)
  const { picture, stableUsername, bio } = user
  const links: ActivityLink[] = [
    { name: 'inventory', url: `${publicOrigin}/users/${username}` as AbsoluteUrl },
  ]
  return buildActorObject({
    actorName: stableUsername,
    displayName: username,
    summary: bio,
    imagePath: picture,
    links,
  })
}

async function getEntityActor (name: EntityActorName) {
  const { entity } = await validateEntity(name)
  const actorName = getEntityActorName(entity.uri)
  const { uri } = entity
  const label = defaultLabel(entity)
  const url = entityUrl(uri)
  const links: ActivityLink[] = [
    {
      name: host,
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
  const attachments: PropertyValueAttachment[] = await buildAttachments(entity)
  let summary
  if ('descriptions' in entity && 'en' in entity.descriptions) {
    summary = entity.descriptions.en
  }
  return buildActorObject({
    actorName,
    displayName: label,
    summary,
    imagePath: entity.image?.url,
    links,
    attachment: attachments,
  })
}

export function makeActorUrl (actorName: string) {
  return `${publicOrigin}/api/activitypub?action=actor&name=${actorName}` as LocalActorUrl
}

export function makeActorKeyUrl (actorName: string, publicKeyHash: string) {
  return `${makeActorUrl(actorName)}#${publicKeyHash}` as AbsoluteUrl
}

async function buildActorObject ({ actorName, displayName, summary, imagePath, links, attachment = [] }: ActorParams) {
  const { publicKey, publicKeyHash } = await getSharedKeyPair()
  const actorUrl = makeActorUrl(actorName)
  // Use the key hash to bust any cached version of an old key
  const keyUrl = makeActorKeyUrl(actorName, publicKeyHash)

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
    inbox: `${publicOrigin}/api/activitypub?action=inbox&name=${actorName}`,
    sharedInbox: `${publicOrigin}/api/activitypub?action=shared-inbox`,
    outbox: `${publicOrigin}/api/activitypub?action=outbox&name=${actorName}`,
    followers: `${publicOrigin}/api/activitypub?action=followers&name=${actorName}`,
    // TODO: experiment with a shared publicKey id and owner, to invite caching system to re-use
    // shared public keys they already know
    publicKey: {
      id: keyUrl,
      owner: actorUrl, // must be actor.id
      publicKeyPem: publicKey,
    },
  }

  if (imagePath) {
    const url = imagePath.startsWith('http') ? imagePath : `${publicOrigin}${imagePath}`
    actor.icon = {
      mediaType: 'image/jpeg',
      type: 'Image',
      url,
    }
  }

  if (links) {
    const linksAttachments = links.map(({ name, url }) => {
      const [ protocol, urlWithoutProtocol ] = url.split('://')
      const value = `<span class="invisible">${protocol}://</span><span>${urlWithoutProtocol}</span>`
      const attachment: PropertyValueAttachment = {
        type: 'PropertyValue',
        name,
        url,
        value: buildLink(url, value),
      }
      return attachment
    })
    actor.attachment = linksAttachments.concat(attachment)
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

export async function getRemoteActor (actorUrl) {
  let remoteActor: RemoteActor = { id: actorUrl }
  try {
    remoteActor = await cache_.get({
      key: `remoteActor:${actorUrl}`,
      fn: () => fetchRemoteActor(actorUrl),
      ttl: oneMonth,
    })
  } catch (err) {
    logError(err, `Cannot fetch remote actor information, actorUrl ${actorUrl}`)
    return remoteActor
  }
  return remoteActor
}

const { sanitizeUrls } = config.activitypub
async function fetchRemoteActor (actorUrl) {
  if (sanitizeUrls) actorUrl = await sanitizeUrl(actorUrl)
  const remoteActorRes = await requests_.get(actorUrl)
  return serializeRemoteActor(remoteActorRes)
}

function serializeRemoteActor (remoteActorRes) {
  const { id, url, preferredUsername, name, icon, inbox } = remoteActorRes
  const remoteActor: RemoteActor = {
    id: id || url,
    name,
    preferredUsername,
    inbox,
  }
  if (icon) {
    Object.assign(remoteActor, { icon: remoteActorRes.icon })
  }
  return remoteActor
}

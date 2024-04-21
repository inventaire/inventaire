import { map, uniq } from 'lodash-es'
import { getGroupsByIds, getUserGroupsCoMembers } from '#controllers/groups/lib/groups'
import { getAllGroupMembersIds } from '#controllers/groups/lib/users_lists'
import { getUserFriends } from '#controllers/relations/lib/lists'
import { isVisibilityGroupKey } from '#lib/boolean_validations'
import type { Item } from '#types/item'
import type { Listing } from '#types/listing'
import type { Shelf } from '#types/shelf'
import type { UserId } from '#types/user'

type DocWithVisibility = Item | Listing | Shelf

// Using a function overload to preserve the output type, but a more succint syntax might exist(?)
export async function filterVisibleDocs (docs: Item[], reqUserId: UserId): Promise<Item[]>
export async function filterVisibleDocs (docs: Listing[], reqUserId: UserId): Promise<Listing[]>
export async function filterVisibleDocs (docs: Shelf[], reqUserId: UserId): Promise<Shelf[]>
export async function filterVisibleDocs (docs: DocWithVisibility[], reqUserId: UserId): Promise<DocWithVisibility[]> {
  if (!reqUserId) return docs.filter(isPublic)

  // Optimizing for the case where all requested docs belong to the requester
  // as that's a frequent case
  if (docs.every(belongToRequester(reqUserId))) return docs

  const [
    friendsIds = [],
    groups = [],
    coGroupsMembersIds = [],
  ] = await getMinimalRequiredUserNetworkData(docs, reqUserId)

  const groupsMembersIdsSets = getGroupsMembersIdsSets(groups)
  return docs.filter(isVisible({ friendsIds, coGroupsMembersIds, groupsMembersIdsSets, reqUserId }))
}

const isPublic = doc => doc.visibility.includes('public')
const belongToRequester = reqUserId => doc => {
  if (!doc) return
  if (doc.owner) return doc.owner === reqUserId
  if (doc.creator) return doc.creator === reqUserId
}

async function getMinimalRequiredUserNetworkData (docs, reqUserId) {
  const allVisibilityKeys = uniq(map(docs, 'visibility').flat())

  const needToFetchFriends = allVisibilityKeys.some(keyRequiresFriendsIds)
  let friendsIdsPromise
  if (needToFetchFriends) {
    friendsIdsPromise = getUserFriends(reqUserId)
  }

  const groupsIds = allVisibilityKeys.filter(isVisibilityGroupKey).map(getGroupIdFromKey)
  let groupsPromise
  if (groupsIds.length > 0) {
    groupsPromise = getGroupsByIds(groupsIds)
  }

  const needToFetchGroupsCoMembers = allVisibilityKeys.some(keyRequiresGroupsCoMembers)
  let coGroupsMembersIdsPromise
  if (needToFetchGroupsCoMembers) {
    coGroupsMembersIdsPromise = getUserGroupsCoMembers(reqUserId)
  }

  return Promise.all([ friendsIdsPromise, groupsPromise, coGroupsMembersIdsPromise ])
}

function getGroupsMembersIdsSets (groups) {
  const groupsMembersIdsSets = {}
  for (const group of groups) {
    groupsMembersIdsSets[group._id] = new Set(getAllGroupMembersIds(group))
  }
  return groupsMembersIdsSets
}

const keyRequiresFriendsIds = key => key === 'friends'
const keyRequiresGroupsCoMembers = key => key === 'groups'

const isVisible = ({ friendsIds, coGroupsMembersIds, groupsMembersIdsSets, reqUserId }) => doc => {
  const { creator, owner, visibility } = doc
  // known cases : shelf.owner or listing.creator
  const docUserId = owner || creator
  if (docUserId === reqUserId) return true
  if (visibility.includes('public')) return true
  if (visibility.includes('groups') && coGroupsMembersIds.includes(docUserId)) return true
  if (visibility.includes('friends') && friendsIds.includes(docUserId)) return true
  for (const key of visibility) {
    if (isVisibilityGroupKey(key)) {
      const groupId = getGroupIdFromKey(key)
      const membersIdsSet = groupsMembersIdsSets[groupId]
      if (membersIdsSet.has(reqUserId)) return true
    }
  }
  return false
}

const getGroupIdFromKey = key => key.split(':')[1]

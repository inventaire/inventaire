import _ from 'builders/utils'
import should from 'should'
import { customAuthReq, publicReq } from '../utils/utils'
import { waitForIndexation } from '../utils/search'
import { createItem, createItemWithEditionAndWork } from '../fixtures/items'
import { createEdition } from 'tests/api/fixtures/entities'
import { getSomeGroupWithAMember, createGroupAndMember } from 'tests/api/fixtures/groups'
import { makeFriends } from 'tests/api/utils/relations'
import { buildUrl } from 'lib/utils/url'

const search = (reqUser, { group, search }) => {
  const url = buildUrl('/api/items', {
    action: 'search',
    group,
    search,
  })
  if (reqUser) {
    return customAuthReq(reqUser, 'get', url)
  } else {
    return publicReq('get', url)
  }
}

describe('items:search:group', () => {
  describe('visibility:public', () => {
    it('should find an public item of common group member', async () => {
      const { group, member } = await getSomeGroupWithAMember()
      const [ item ] = await Promise.all([
        createItemWithEditionAndWork(member, { visibility: [ 'public' ] }),
      ])
      await waitForIndexation('items', item._id)
      const { 'entity:title': title } = item.snapshot
      const { items } = await search(null, { group: group._id, search: title })
      _.map(items, '_id').should.containEql(item._id)
    })
  })

  describe('visibility:private', () => {
    it('should not find private item of a group member by another group member', async () => {
      const { group, member } = await getSomeGroupWithAMember()
      const { member: memberOfAnotherGroup } = await createGroupAndMember()
      const [ item ] = await Promise.all([
        createItemWithEditionAndWork(member, { visibility: [] }),
      ])
      await waitForIndexation('items', item._id)
      const { 'entity:title': title } = item.snapshot
      const { items } = await search(memberOfAnotherGroup, { group: group._id, search: title })
      _.map(items, '_id').should.not.containEql(item._id)
    })
  })

  describe('visibility:groups', () => {
    it('should find items visible by all user groups but not visible to friends', async () => {
      const { group, admin, member } = await getSomeGroupWithAMember()
      const { uri } = await createEdition()
      const [ privateItem, friendsOnlyItem, groupsOnlyItem ] = await Promise.all([
        createItem(admin, { entity: uri, visibility: [] }),
        createItem(admin, { entity: uri, visibility: [ 'friends' ] }),
        createItem(admin, { entity: uri, visibility: [ 'groups' ] }),
      ])
      await Promise.all([
        waitForIndexation('items', privateItem._id),
        waitForIndexation('items', friendsOnlyItem._id),
        waitForIndexation('items', groupsOnlyItem._id),
      ])
      const { 'entity:title': title } = privateItem.snapshot
      const { items } = await search(member, { group: group._id, search: title })
      const itemsIds = _.map(items, '_id')
      itemsIds.should.not.containEql(privateItem._id)
      itemsIds.should.not.containEql(friendsOnlyItem._id)
      itemsIds.should.containEql(groupsOnlyItem._id)
      items.forEach(item => should(item.visibility).not.be.ok())
    })

    it('should not find items visible by groups while the users are friends but not in a common group', async () => {
      const { group, member } = await getSomeGroupWithAMember()
      const { member: memberOfAnotherGroup } = await createGroupAndMember()
      await makeFriends(member, memberOfAnotherGroup)
      const { uri } = await createEdition()
      const groupsOnlyItem = await createItem(member, { entity: uri, visibility: [ 'groups' ] })
      await waitForIndexation('items', groupsOnlyItem._id)
      const { 'entity:title': title } = groupsOnlyItem.snapshot
      const { items } = await search(memberOfAnotherGroup, { group: group._id, search: title })
      const itemsIds = _.map(items, '_id')
      itemsIds.should.not.containEql(groupsOnlyItem._id)
    })
  })

  describe('visibility:group-specific', () => {
    it('should find items visible by a specific group', async () => {
      const { group, admin, member } = await getSomeGroupWithAMember()
      const { uri } = await createEdition()
      const groupSpecificItem = await createItem(admin, { entity: uri, visibility: [ `group:${group._id}` ] })
      await waitForIndexation('items', groupSpecificItem._id)
      const { 'entity:title': title } = groupSpecificItem.snapshot
      const { items } = await search(member, { group: group._id, search: title })
      const itemsIds = _.map(items, '_id')
      itemsIds.should.containEql(groupSpecificItem._id)
      items.forEach(item => should(item.visibility).not.be.ok())
    })

    it('should not find items visible by a specific group to which the requester does not belong', async () => {
      const { group, member } = await getSomeGroupWithAMember()
      const { member: memberOfAnotherGroup } = await createGroupAndMember()
      await makeFriends(member, memberOfAnotherGroup)
      const { uri } = await createEdition()
      const groupSpecificItem = await createItem(member, { entity: uri, visibility: [ `group:${group._id}` ] })
      await waitForIndexation('items', groupSpecificItem._id)
      const { 'entity:title': title } = groupSpecificItem.snapshot
      const { items } = await search(memberOfAnotherGroup, { group: group._id, search: title })
      const itemsIds = _.map(items, '_id')
      itemsIds.should.not.containEql(groupSpecificItem._id)
      items.forEach(item => should(item.visibility).not.be.ok())
    })
  })
})

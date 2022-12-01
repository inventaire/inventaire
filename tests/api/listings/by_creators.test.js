const should = require('should')
const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors, customAuthReq } = require('tests/api/utils/utils')
const { publicReq, authReq, getUserB, getReservedUser } = require('../utils/utils')
const { createListing, createElement } = require('../fixtures/listings')
const { map } = require('lodash')
const { createGroupWithAMember, createGroup, addMember } = require('tests/api/fixtures/groups')
const { getTwoFriends } = require('tests/api/fixtures/users')
const { getGroupVisibilityKey } = require('lib/visibility/visibility')

const endpoint = '/api/lists?action=by-creators'

describe('listings:by-creators', () => {
  it('should reject without users', async () => {
    try {
      const res = await authReq('get', endpoint)
      shouldNotBeCalled(res)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in query: users')
      err.statusCode.should.equal(400)
    }
  })

  it('should be empty without listings', async () => {
    const user = await getReservedUser()
    const { _id: userId } = user
    const res = await publicReq('get', `${endpoint}&users=${userId}`)
    res.lists.should.deepEqual([])
  })

  describe('visibility:overview', () => {
  // for detailed visibility validations, see tests listings/by_ids
    it('should get a public listing', async () => {
      const { listing } = await createListing()
      listing.visibility.should.deepEqual([ 'public' ])
      const res = await publicReq('get', `${endpoint}&users=${listing.creator}`)
      const listingsIds = map(res.lists, '_id')
      listingsIds.should.containEql(listing._id)
    })

    it('should not return private lists', async () => {
      const { listing } = await createListing(getUserB(), { visibility: [] })
      const user = await getUserB()
      const res = await authReq('get', `${endpoint}&users=${user._id}`)
      const listingsIds = map(res.lists, '_id')
      listingsIds.should.not.containEql(listing._id)
    })
  })

  describe('pagination', () => {
    it('should take a limit parameter', async () => {
      const { listing } = await createListing()
      await createListing()
      const res = await publicReq('get', `${endpoint}&users=${listing.creator}`)
      Object.values(res.lists).length.should.be.aboveOrEqual(2)
      const res2 = await publicReq('get', `${endpoint}&users=${listing.creator}&limit=1`)
      Object.values(res2.lists).length.should.equal(1)
    })

    it('should take an offset parameter', async () => {
      const { listing } = await createListing()
      await createListing()
      const offset = 1
      const { lists: listings1 } = await publicReq('get', `${endpoint}&users=${listing.creator}`)
      const { lists: listings2 } = await publicReq('get', `${endpoint}&users=${listing.creator}&offset=${offset}`)
      const listsLength = Object.values(listings1).length
      const listings2Length = Object.values(listings2).length
      should(listsLength - offset).equal(listings2Length)
    })
  })

  describe('with-elements', () => {
    it('should get a listing without its elements by default', async () => {
      const { listing } = await createElement({})
      const res = await publicReq('get', `${endpoint}&users=${listing.creator}`)
      should(res.lists[0].elements).not.be.ok()
    })

    it('should get a listing with its elements', async () => {
      const { listing } = await createElement({})
      const res = await publicReq('get', `${endpoint}&users=${listing.creator}&with-elements=true`)
      res.lists[0].elements.should.be.an.Array()
    })
  })

  describe('context', () => {
    it('should reject invalid visibility key', async () => {
      const user = await getReservedUser()
      return customAuthReq(user, 'get', `${endpoint}&users=${user._id}&context=''`)
      .then(shouldNotBeCalled)
      .catch(err => {
        err.statusCode.should.equal(400)
        err.body.status_verbose.should.startWith('invalid context')
      })
    })

    it('should not return the requesting user private listings in a group context', async () => {
      // to avoid giving the false impression that those are visible by other members of the group
      const user = await getReservedUser()
      const group = await createGroup({ user })
      const groupVisibilityKey = getGroupVisibilityKey(group._id)
      const { listing: privateListing } = await createListing(user, { visibility: [] })
      const { lists: listings } = await customAuthReq(user, 'get', `${endpoint}&users=${user._id}&context=${groupVisibilityKey}`)
      const listingsIds = map(listings, '_id')
      listingsIds.should.not.containEql(privateListing._id)
    })

    it('should not return friends-only listings in a group context', async () => {
      const [ userA, userB ] = await getTwoFriends()
      const group = await createGroup({ user: userA })
      await addMember(group, userB)
      const groupVisibilityKey = getGroupVisibilityKey(group._id)
      const { listing: friendsOnlyListing } = await createListing(userA, { visibility: [ 'friends' ] })
      const { lists: listings } = await customAuthReq(userB, 'get', `${endpoint}&users=${userA._id}&context=${groupVisibilityKey}&limit=1000`)
      const listingsIds = map(listings, '_id')
      listingsIds.should.not.containEql(friendsOnlyListing._id)
    })

    it('should not return group-specific listings in another group', async () => {
      const { group: groupA, admin: userA, member: userB } = await createGroupWithAMember()
      const groupB = await createGroup({ user: userA })
      await addMember(groupB, userB)
      const groupAVisibilityKey = getGroupVisibilityKey(groupA._id)
      const groupBVisibilityKey = getGroupVisibilityKey(groupB._id)
      const { listing: groupSpecificListing } = await createListing(userA, {
        visibility: [ groupAVisibilityKey ]
      })
      const { lists: listings } = await customAuthReq(userB, 'get', `${endpoint}&users=${userA._id}&context=${groupBVisibilityKey}&limit=1000`)
      const listingsIds = map(listings, '_id')
      listingsIds.should.not.containEql(groupSpecificListing._id)
    })
  })
})

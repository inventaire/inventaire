import should from 'should'
import _ from '#builders/utils'
import { randomWords } from '#fixtures/text'
import { createUser } from '#fixtures/users'
import { customAuthReq } from '#tests/api/utils/request'
import { getOrCreateUser } from '../fixtures/users.js'
import { waitForIndexation } from '../utils/search.js'
import { publicReq, getUser, getUserB } from '../utils/utils.js'

describe('users:search', () => {
  it('should find a user', async () => {
    const user = await getUser()
    await waitForIndexation('users', user._id)
    const { username } = user
    const res = await publicReq('get', `/api/users?action=search&search=${username}`)
    usersIds(res).includes(user._id).should.be.true()
  })

  it('should find a user even with just a prefix', async () => {
    const user = await getUser()
    await waitForIndexation('users', user._id)
    const prefix = user.username.slice(0, 5)
    const res = await publicReq('get', `/api/users?action=search&search=${prefix}`)
    usersIds(res).includes(user._id).should.be.true()
  })

  it('should find a user even with a typo', async () => {
    // Using a user with a non-random username to make the typo not to hard
    // to recover for ElasticSearch
    const username = 'testuser'
    const user = await getOrCreateUser({ username })
    await waitForIndexation('users', user._id)
    const res = await customAuthReq(user, 'get', '/api/users?action=search&search=testusr')
    // should find any user with the same name (to pass as test-quick)
    // not necessarly the one created for this test
    _.map(res.users, 'username').includes(username).should.be.true()
  })

  it('should not return snapshot data', async () => {
    const user = await getUserB()
    await waitForIndexation('users', user._id)
    const res = await publicReq('get', `/api/users?action=search&search=${user.username}`)
    usersIds(res).includes(user._id).should.be.true()
    should(res.users[0].snapshot).not.be.ok()
  })

  it('should find a user by its bio', async () => {
    const bio = randomWords(5)
    const user = await createUser({ bio })
    await waitForIndexation('users', user._id)
    const res = await publicReq('get', `/api/users?action=search&search=${encodeURIComponent(bio)}`)
    usersIds(res).includes(user._id).should.be.true()
  })
})

const usersIds = res => _.map(res.users, '_id')

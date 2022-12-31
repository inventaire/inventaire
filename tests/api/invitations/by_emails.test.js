import 'should'
import { authReq, authReqB, authReqC, shouldNotBeCalled } from '../utils/utils'
import { getSomeGroup } from '../fixtures/groups'
import { getGroup } from 'tests/api/utils/groups'
import { signup } from '../fixtures/users'
import randomString from 'lib/utils/random_string'
const randomEmail = () => `a${randomString(4).toLowerCase()}@foo.org`
const endpoint = '/api/invitations?action=by-emails'

// Do not re-test what test/libs/045-parse_emails unit tests already test

describe('invitations:by-emails', () => {
  describe('friends', () => {
    it('should accept an email as a string', async () => {
      const { emails } = await authReq('post', endpoint, { emails: 'a@foo.org' })
      emails[0].should.equal('a@foo.org')
    })

    it('should accept several emails as a string', async () => {
      const { emails } = await authReq('post', endpoint, { emails: 'a@foo.org,b@foo.org' })
      emails[0].should.equal('a@foo.org')
      emails[1].should.equal('b@foo.org')
    })

    it('should accept several emails as an array', async () => {
      const { emails } = await authReq('post', endpoint, { emails: [ 'a@foo.org', 'b@foo.org' ] })
      emails[0].should.equal('a@foo.org')
      emails[1].should.equal('b@foo.org')
    })

    it('should accept an empty message', async () => {
      const { emails } = await authReq('post', endpoint, { emails: 'a@foo.org', message: '' })
      emails[0].should.equal('a@foo.org')
    })

    it('should reject missing emails', async () => {
      await authReq('post', endpoint, {})
      .then(shouldNotBeCalled)
      .catch(err => {
        err.body.status_verbose.should.equal('missing parameter in body: emails')
      })
    })

    it('should reject invalid message', async () => {
      await authReq('post', endpoint, {
        emails: 'a@foo.org',
        message: []
      })
      .then(shouldNotBeCalled)
      .catch(err => {
        err.statusCode.should.equal(400)
        err.body.status_verbose.should.match(/invalid message:/)
      })
    })

    it('should trigger a friend request on signup', async () => {
      const email = randomEmail()

      const invite = () => authReq('post', endpoint, { emails: email })

      await invite()
      await signup(email)
      const relations = await authReq('get', '/api/relations')
      const res = await invite()
      res.users[0].email.should.equal(email)
      relations.userRequested.should.containEql(res.users[0]._id)
    })
  })

  describe('groups', () => {
    it('should reject invalid group ids', async () => {
      await authReq('post', endpoint, {
        emails: 'a@foo.org',
        group: 'abc'
      })
      .then(shouldNotBeCalled)
      .catch(err => {
        err.statusCode.should.equal(400)
        err.body.status_verbose.should.equal('invalid group: abc')
      })
    })

    it('should accept valid group ids', async () => {
      const group = await getSomeGroup()
      const { emails } = await authReq('post', endpoint, {
        emails: 'a@foo.org',
        group: group._id
      })
      emails[0].should.equal('a@foo.org')
    })

    it('should accept non-user admin requests to invite to a group', async () => {
      const group = await getSomeGroup()
      // User B is a member (see ../fixtures/groups.js)
      const { emails } = await authReqB('post', endpoint, {
        emails: 'a@foo.org',
        group: group._id
      })
      emails[0].should.equal('a@foo.org')
    })

    it('should reject non-member requests to invite to a group', async () => {
      const group = await getSomeGroup()
      // User C isnt a member
      await authReqC('post', endpoint, {
        emails: 'a@foo.org',
        group: group._id
      })
      .then(shouldNotBeCalled)
      .catch(err => {
        err.statusCode.should.equal(403)
        err.body.status_verbose.should.equal("user isn't a group member")
      })
    })

    it('should trigger an invite on signup', async () => {
      const email = randomEmail()
      const group = await getSomeGroup()
      const invite = () => authReq('post', endpoint, { emails: email, group: group._id })
      await invite()
      await signup(email)
      const updatedGroup = await getGroup(group)
      const prevInvitedCount = group.invited.length
      const invitedCount = updatedGroup.invited.length
      invitedCount.should.equal(prevInvitedCount + 1)
      const lastUserId = updatedGroup.invited.at(-1).user
      const { users } = await invite()
      users[0].email.should.equal(email)
      users[0]._id.should.equal(lastUserId)
    })
  })
})

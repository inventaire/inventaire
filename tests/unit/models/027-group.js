require('should')
const CONFIG = require('config')
const __ = CONFIG.universalPath
const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = require('../utils')
const someUserId = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const someOtherUserId = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab'
const someOtherUserId2 = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaac'
const { wait } = __.require('lib', 'promises')

const Group = __.require('models', 'group')

const createSomeGroup = () => {
  return Group.create({
    name: 'a',
    description: '',
    searchable: false,
    position: null,
    creatorId: someUserId,
    open: false
  })
}

describe('group model', () => {
  describe('create', () => {
    it('should reject without creatorId', () => {
      try {
        const doc = Group.create({ name: 'a', description: '', searchable: false, position: null })
        shouldNotBeCalled(doc)
      } catch (err) {
        rethrowShouldNotBeCalledErrors(err)
        err.message.should.equal('invalid creatorId: undefined')
      }
    })

    it('should generate a group document', () => {
      const group = createSomeGroup()
      group.admins.should.be.an.Array()
      group.admins[0].user.should.equal(someUserId)
      group.members.should.deepEqual([])
      group.invited.should.deepEqual([])
      group.declined.should.deepEqual([])
      group.requested.should.deepEqual([])
    })

    it('should create an open group', () => {
      const doc = Group.create({
        name: 'a',
        creatorId: someUserId,
        description: '',
        searchable: false,
        position: null,
        open: true
      })
      doc.open.should.be.true()
    })
  })

  describe('invite', () => {
    it('should invite a user', () => {
      const group = createSomeGroup()
      Group.invite(someUserId, someOtherUserId, group)
      group.invited[0].user.should.equal(someOtherUserId)
    })
  })

  describe('accept', () => {
    it('should accept an invitation', () => {
      const group = createSomeGroup()
      Group.invite(someUserId, someOtherUserId, group)
      Group.accept(someOtherUserId, null, group)
      group.invited.length.should.equal(0)
      group.members[0].user.should.equal(someOtherUserId)
    })
  })

  describe('decline', () => {
    it('should decline an invitation', () => {
      const group = createSomeGroup()
      Group.invite(someUserId, someOtherUserId, group)
      Group.decline(someOtherUserId, null, group)
      group.invited.length.should.equal(0)
      group.declined[0].user.should.equal(someOtherUserId)
    })
  })

  describe('request', () => {
    it('should add a request to join', () => {
      const group = createSomeGroup()
      Group.request(someOtherUserId, null, group)
      group.requested[0].user.should.equal(someOtherUserId)
    })
  })

  describe('cancelRequest', () => {
    it('should cancel a request to join', () => {
      const group = createSomeGroup()
      Group.request(someOtherUserId, null, group)
      Group.cancelRequest(someOtherUserId, null, group)
      group.requested.length.should.equal(0)
    })
  })

  describe('acceptRequest', () => {
    it('should accept a request to join', () => {
      const group = createSomeGroup()
      Group.request(someOtherUserId, null, group)
      Group.acceptRequest(someUserId, someOtherUserId, group)
      group.requested.length.should.equal(0)
      group.members[0].user.should.equal(someOtherUserId)
    })
  })

  describe('refuseRequest', () => {
    it('should refuse a request to join', () => {
      const group = createSomeGroup()
      Group.request(someOtherUserId, null, group)
      Group.refuseRequest(someUserId, someOtherUserId, group)
      group.requested.length.should.equal(0)
    })
  })

  describe('makeAdmin', () => {
    it('should make a user admin', () => {
      const group = createSomeGroup()
      Group.invite(someUserId, someOtherUserId, group)
      Group.accept(someOtherUserId, null, group)
      Group.makeAdmin(someUserId, someOtherUserId, group)
      group.members.length.should.equal(0)
      group.admins[1].user.should.equal(someOtherUserId)
    })
  })

  describe('kick', () => {
    it('should kick a user from group', () => {
      const group = createSomeGroup()
      Group.invite(someUserId, someOtherUserId, group)
      Group.accept(someOtherUserId, null, group)
      Group.kick(someUserId, someOtherUserId, group)
      group.members.length.should.equal(0)
    })
  })

  describe('leave', () => {
    it('should leave a group', () => {
      const group = createSomeGroup()
      Group.invite(someUserId, someOtherUserId, group)
      Group.accept(someOtherUserId, null, group)
      Group.leave(someOtherUserId, null, group)
      group.members.length.should.equal(0)
    })
  })

  describe('delete user', () => {
    it('should delete a member', () => {
      const group = createSomeGroup()
      Group.invite(someUserId, someOtherUserId, group)
      Group.accept(someOtherUserId, null, group)
      Group.deleteUser(group, someOtherUserId)
      group.members.length.should.equal(0)
    })

    it('should delete an invited user', () => {
      const group = createSomeGroup()
      Group.invite(someUserId, someOtherUserId, group)
      Group.deleteUser(group, someOtherUserId)
      group.invited.length.should.equal(0)
    })

    it('should delete a requesting user', () => {
      const group = createSomeGroup()
      Group.request(someOtherUserId, null, group)
      Group.deleteUser(group, someOtherUserId)
      group.requested.length.should.equal(0)
    })

    it('should delete an admin when there are other admins', () => {
      const group = createSomeGroup()
      Group.invite(someUserId, someOtherUserId, group)
      Group.accept(someOtherUserId, null, group)
      Group.makeAdmin(someUserId, someOtherUserId, group)
      Group.deleteUser(group, someOtherUserId)
      group.admins.length.should.equal(1)
      group.admins[0].user.should.equal(someUserId)
    })

    it('should delete an admin and pass admin role when there are other members', async () => {
      const group = createSomeGroup()
      Group.invite(someUserId, someOtherUserId, group)
      Group.accept(someOtherUserId, null, group)
      // Wait so that the second user is added with a different timestamp
      await wait(10)
      Group.invite(someUserId, someOtherUserId2, group)
      Group.accept(someOtherUserId2, null, group)
      Group.deleteUser(group, someUserId)
      group.admins.length.should.equal(2)
      group.admins[0].user.should.equal(someOtherUserId)
      group.admins[1].user.should.equal(someOtherUserId2)
      group.members.length.should.equal(0)
    })
  })
})

const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const Notification = __.require('models', 'notification')
const someUserId = '1234567890a1234567890b1234567890'
const someGroupUpdateData = () => ({
  group: '5b855aa912e3f4d6265846d3cd035382',
  user: '5b855aa912e3f4d6265846d3cd03453b',
  attribute: 'name',
  newValue: 'laborum eum nihil group-updated',
  previousValue: 'laborum eum nihil group',
})

describe('notification model', () => {
  describe('create', () => {
    it('should reject notification without a user id', () => {
      Notification.create.bind(null, {
        type: 'groupUpdate',
        data: someGroupUpdateData()
      })
      .should.throw(/invalid user/)
    })

    it('should reject notification with an invalid user id', () => {
      Notification.create.bind(null, {
        user: 'foo',
        type: 'groupUpdate',
        data: someGroupUpdateData()
      })
      .should.throw(/invalid user/)
    })

    it('should reject notification without a type', () => {
      Notification.create.bind(null, {
        user: someUserId,
        data: someGroupUpdateData()
      })
      .should.throw(/invalid type/)
    })

    it('should reject notification with an invalid type', () => {
      Notification.create.bind(null, {
        user: someUserId,
        type: 'foo',
        data: someGroupUpdateData()
      })
      .should.throw(/invalid type/)
    })

    it('should reject notification without a data object', () => {
      Notification.create.bind(null, {
        user: someUserId,
        type: 'groupUpdate',
      })
      .should.throw(/invalid data/)
    })

    it('should return a notification object', () => {
      const notificationDoc = Notification.create({
        user: someUserId,
        type: 'groupUpdate',
        data: someGroupUpdateData()
      })
      notificationDoc.should.be.an.Object()
      notificationDoc.user.should.equal(someUserId)
      notificationDoc.type.should.equal('groupUpdate')
      notificationDoc.status.should.equal('unread')
      notificationDoc.time.should.be.belowOrEqual(Date.now())
      notificationDoc.time.should.be.above(Date.now() - 10)
    })
  })
})

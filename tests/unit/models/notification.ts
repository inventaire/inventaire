import 'should'
import { someCouchUuid } from '#fixtures/general'
import { wait } from '#lib/promises'

const someUserId = someCouchUuid
const someGroupUpdateData = () => ({
  group: '5b855aa912e3f4d6265846d3cd035382',
  user: '5b855aa912e3f4d6265846d3cd03453b',
  attribute: 'name',
  newValue: 'laborum eum nihil group-updated',
  previousValue: 'laborum eum nihil group',
})
const someNotificationDoc = () => {
  const notificationDoc = createNotificationDoc({
    user: someUserId,
    type: 'groupUpdate',
    data: someGroupUpdateData(),
  })
  notificationDoc._id = someCouchUuid
  notificationDoc._rev = `1-${someCouchUuid}`
  return notificationDoc
}

describe('notification model', () => {
  describe('create', () => {
    it('should reject notification without a user id', () => {
      createNotificationDoc.bind(null, {
        type: 'groupUpdate',
        data: someGroupUpdateData(),
      })
      .should.throw(/invalid user/)
    })

    it('should reject notification with an invalid user id', () => {
      createNotificationDoc.bind(null, {
        user: 'foo',
        type: 'groupUpdate',
        data: someGroupUpdateData(),
      })
      .should.throw(/invalid user/)
    })

    it('should reject notification without a type', () => {
      createNotificationDoc.bind(null, {
        user: someUserId,
        data: someGroupUpdateData(),
      })
      .should.throw(/invalid type/)
    })

    it('should reject notification with an invalid type', () => {
      createNotificationDoc.bind(null, {
        user: someUserId,
        type: 'foo',
        data: someGroupUpdateData(),
      })
      .should.throw(/invalid type/)
    })

    it('should reject notification without a data object', () => {
      createNotificationDoc.bind(null, {
        user: someUserId,
        type: 'groupUpdate',
      })
      .should.throw(/expected object/)
    })

    it('should return a notification object', () => {
      const notificationDoc = createNotificationDoc({
        user: someUserId,
        type: 'groupUpdate',
        data: someGroupUpdateData(),
      })
      notificationDoc.should.be.an.Object()
      notificationDoc.user.should.equal(someUserId)
      notificationDoc.type.should.equal('groupUpdate')
      notificationDoc.status.should.equal('unread')
      notificationDoc.time.should.be.belowOrEqual(Date.now())
      notificationDoc.time.should.be.above(Date.now() - 10)
    })

    describe('group update notification', () => {
      it('should reject notification without a data.attribute', () => {
        const data = someGroupUpdateData()
        delete data.attribute
        createNotificationDoc.bind(null, {
          user: someUserId,
          type: 'groupUpdate',
          data,
        })
        .should.throw(/invalid attribute/)
      })
    })
  })

  describe('update', () => {
    it('should update the notification timestamp', async () => {
      const notificationDoc = someNotificationDoc()
      const { time } = notificationDoc
      await wait(2)
      updateNotificationDoc(notificationDoc)
      notificationDoc.time.should.be.above(time)
    })

    it('should reject an invalid doc object', async () => {
      updateNotificationDoc.bind(null, {}).should.throw(/^invalid doc _id/)
    })
  })
})

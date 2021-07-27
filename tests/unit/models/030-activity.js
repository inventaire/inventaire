require('should')
const Activity = require('models/activity')
const someCouchUuid = '1234567890a1234567890b1234567890'
const someActitvityData = () => ({
  type: 'Create',
  actor: {
    username: 'foo',
  },
  object: {
    content: 'some string note',
    itemsIds: [ someCouchUuid ],
  }
})

describe('activity model', () => {
  describe('create', () => {
    it('should reject activity without a type', () => {
      Activity.create.bind(null, {
        actor: {},
        object: {}
      })
      .should.throw(/expected string/)
    })

    it('should reject activity without an actor', () => {
      Activity.create.bind(null, {
        type: 'Follow',
        object: {}
      })
      .should.throw(/expected object/)
    })

    it('should reject activity with an invalid type', () => {
      const activity = someActitvityData()
      activity.type = 'foo'
      Activity.create.bind(null, activity)
      .should.throw(/invalid type/)
    })

    it('should reject object with invalid attribute', () => {
      const activity = someActitvityData()
      activity.object.foo = 'bar'
      Activity.create.bind(null, activity)
      .should.throw(/invalid attribute/)
    })

    it('should reject activity with an invalid actor', () => {
      const activity = someActitvityData()
      activity.actor.foo = 'bar'
      Activity.create.bind(null, activity)
      .should.throw(/invalid attribute/)
    })

    it('should reject object with an document id', () => {
      const activity = someActitvityData()
      activity.object.itemsIds[0] = 'bar'
      Activity.create.bind(null, activity)
      .should.throw(/invalid id/)
    })

    it('should return a activity object', () => {
      const activityDoc = Activity.create(someActitvityData())
      activityDoc.should.be.an.Object()
      activityDoc.type.should.equal('Create')
      activityDoc.actor.username.should.be.a.String()
      activityDoc.object.content.should.be.a.String()
      activityDoc.object.itemsIds.should.be.a.Array()
    })
  })
})

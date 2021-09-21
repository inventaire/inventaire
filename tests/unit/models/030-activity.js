require('should')
const Activity = require('models/activity')
const someActitvityData = () => ({
  type: 'Create',
  actor: {
    name: 'foo',
  },
  object: {
    content: 'some string note',
    items: { since: Date.now() - 5000, until: Date.now() },
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

    it('should reject object with an invalid timestamp', () => {
      const activity = someActitvityData()
      activity.object.items.until = 'bar'
      Activity.create.bind(null, activity)
      .should.throw(/expected number/)
    })

    it('should return a activity object', () => {
      const activityDoc = Activity.create(someActitvityData())
      activityDoc.should.be.an.Object()
      activityDoc.type.should.equal('Create')
      activityDoc.actor.name.should.be.a.String()
      activityDoc.object.content.should.be.a.String()
      activityDoc.object.items.should.be.an.Object()
    })
  })
})

const assert_ = require('lib/utils/assert_types')
const { baseActivityValidations } = require('./validations/activity')
const attributes = require('./attributes/activity')
const error_ = require('lib/error/error')

module.exports = {
  create: activity => {
    assert_.object(activity)
    assert_.string(activity.type)
    assert_.object(activity.actor)
    if (activity.id) activity.externalId = activity.id
    delete activity.id
    delete activity.context
    delete activity['@context']

    const newActivity = {}
    Object.keys(activity).forEach(key => {
      const value = activity[key]
      if (!attributes.includes(key)) {
        throw error_.new(`invalid attribute: ${value}`, 400, { activity })
      }
      baseActivityValidations.pass(key, value)
      newActivity[key] = value
    })
    newActivity.created = newActivity.updated = Date.now()
    return newActivity
  },
  update: activity => {
    baseActivityValidations.pass('object', activity.object)
    baseActivityValidations.pass('actor', activity.actor)
    baseActivityValidations.pass('type', activity.type)

    activity.updated = Date.now()
    return activity
  }
}

import { error_ } from '#lib/error/error'
import { assert_ } from '#lib/utils/assert_types'
import attributes from './attributes/activity.js'
import { baseActivityValidations } from './validations/activity.js'

export default {
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
  },
}

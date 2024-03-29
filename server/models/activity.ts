import { newError } from '#lib/error/error'
import { assert_ } from '#lib/utils/assert_types'
import type { Activity } from '#types/activity'
import attributes from './attributes/activity.js'
import { baseActivityValidations } from './validations/activity.js'

export function createActivityDoc (activity) {
  assert_.object(activity)
  assert_.string(activity.type)
  assert_.object(activity.actor)
  if (activity.id) activity.externalId = activity.id
  delete activity.id
  delete activity.context
  delete activity['@context']

  const newActivity: Partial<Activity> = {}
  Object.keys(activity).forEach(key => {
    const value = activity[key]
    if (!attributes.includes(key)) {
      throw newError(`invalid attribute: ${value}`, 400, { activity })
    }
    baseActivityValidations.pass(key, value)
    newActivity[key] = value
  })
  newActivity.created = newActivity.updated = Date.now()
  return newActivity
}

// Not used
// export function updateActivityDoc (activity) {
//   baseActivityValidations.pass('object', activity.object)
//   baseActivityValidations.pass('actor', activity.actor)
//   baseActivityValidations.pass('type', activity.type)

//   activity.updated = Date.now()
//   return activity
// }

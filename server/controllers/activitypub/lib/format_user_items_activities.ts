import { compact, flatten } from 'lodash-es'
import { getPublicItemsByOwnerAndDate } from '#controllers/items/lib/items'
import { isNonEmptyArray } from '#lib/boolean_validations'
import type { ActivityDoc, CreateActivity } from '#types/activity'
import type { RelativeUrl, AbsoluteUrl } from '#types/common'
import type { User } from '#types/user'
import { createItemsNote, createItemsActivities, findFullRangeFromActivities } from './format_items_activities.js'
import { makeUrl } from './helpers.js'

export default async function (activitiesDocs: ActivityDoc[], user: User) {
  if (!isNonEmptyArray(activitiesDocs)) return []
  const { stableUsername: name } = user
  const actor: AbsoluteUrl = makeUrl({ params: { action: 'actor', name } })
  const parentLink: RelativeUrl = `/users/${name}`
  const { language } = user
  const { since, until } = findFullRangeFromActivities(activitiesDocs)

  const allActivitiesItems = await getPublicItemsByOwnerAndDate({
    ownerId: user._id,
    since,
    until,
  })
  let formattedActivities: CreateActivity[] = []
  if (user.poolActivities) {
    formattedActivities = await Promise.all(activitiesDocs.map(createItemsNote({ allActivitiesItems, lang: language, name, actor, parentLink })))
  } else {
    formattedActivities = flatten(await Promise.all(activitiesDocs.map(createItemsActivities({ allActivitiesItems, lang: language, name, actor, parentLink }))))
  }
  return compact(formattedActivities)
}

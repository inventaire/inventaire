import { compact } from 'lodash-es'
import { getPublicItemsByOwnerAndDate } from '#controllers/items/lib/items'
import { isNonEmptyArray } from '#lib/boolean_validations'
import type { RelativeUrl, AbsoluteUrl } from '#types/common'
import { createItemsNote, findFullRangeFromActivities } from './format_items_activities.js'
import { makeUrl } from './helpers.js'

export default async function (activitiesDocs, user) {
  if (!isNonEmptyArray(activitiesDocs)) return []
  const { stableUsername: name } = user
  const actor: AbsoluteUrl = makeUrl({ params: { action: 'actor', name } })
  const parentLink: RelativeUrl = `/users/${name}`
  const { lang } = user
  const { since, until } = findFullRangeFromActivities(activitiesDocs)

  const allActivitiesItems = await getPublicItemsByOwnerAndDate({
    ownerId: user._id,
    since,
    until,
  })

  const formattedActivities = await Promise.all(activitiesDocs.map(createItemsNote({ allActivitiesItems, lang, name, actor, parentLink })))
  return compact(formattedActivities)
}

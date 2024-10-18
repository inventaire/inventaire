import wdk from 'wikibase-sdk/wikidata.org'
import { isWdEntityId } from '#lib/boolean_validations'
import { requests_ } from '#lib/requests'
import type { AbsoluteUrl } from '#types/common'

const { getEntitiesFromSitelinks } = wdk

export default async function ({ site, title }) {
  const url = getEntitiesFromSitelinks({ sites: site, titles: title, props: 'info' }) as AbsoluteUrl
  const { entities } = await requests_.get(url)
  const id = Object.keys(entities)[0]
  // id will equal -1 when not found
  if (isWdEntityId(id)) return id
}

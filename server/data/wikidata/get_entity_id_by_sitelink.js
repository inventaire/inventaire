import { getEntitiesFromSitelinks, isItemId } from 'wikidata-sdk'
import requests_ from '#lib/requests'

export default async ({ site, title }) => {
  const url = getEntitiesFromSitelinks({ sites: site, titles: title, props: 'info' })
  const { entities } = await requests_.get(url)
  const id = Object.keys(entities)[0]
  // id will equal -1 when not found
  if (isItemId(id)) return id
}

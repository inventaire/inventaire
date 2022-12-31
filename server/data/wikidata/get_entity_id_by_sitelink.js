import 'module-alias/register'
import requests_ from 'lib/requests'
import { getEntitiesFromSitelinks, isItemId } from 'wikidata-sdk'

export default async ({ site, title }) => {
  const url = getEntitiesFromSitelinks({ sites: site, titles: title, props: 'info' })
  const { entities } = await requests_.get(url)
  const id = Object.keys(entities)[0]
  // id will equal -1 when not found
  if (isItemId(id)) return id
}

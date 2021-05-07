require('module-alias/register')
const requests_ = require('lib/requests')
const { getEntitiesFromSitelinks, isItemId } = require('wikidata-sdk')

module.exports = async ({ site, title }) => {
  const url = getEntitiesFromSitelinks({ sites: site, titles: title, props: 'info' })
  const { entities } = await requests_.get(url)
  const id = Object.keys(entities)[0]
  // id will equal -1 when not found
  if (isItemId(id)) return id
}

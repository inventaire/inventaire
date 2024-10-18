import mappings from '#db/elasticsearch/mappings/mappings'
import settings from '#db/elasticsearch/settings/settings'
import { requests_ } from '#lib/requests'
import { warn, success } from '#lib/utils/logs'
import config from '#server/config'
import type { AbsoluteUrl } from '#types/common'

const { origin } = config.elasticsearch

export default async function (index) {
  const url = `${origin}/${index}` as AbsoluteUrl
  const indexBaseName = index.split('-')[0]
  const indexMappings = mappings[indexBaseName]
  const body = { settings, mappings: indexMappings }
  try {
    const res = await requests_.put(url, { body })
    success(res, `elasticsearch index created: ${url}`)
  } catch (err) {
    ignoreAlreadyExisting(url, err)
  }
}

function ignoreAlreadyExisting (url, err) {
  if (err.body && ignoredErrorTypes.includes(err.body.error.type)) {
    return warn(url, 'database already exist')
  } else {
    throw err
  }
}

const ignoredErrorTypes = [
  'resource_already_exists_exception',
  // Typically associated with "reason: 'Invalid index name [wikidata], already exists as alias'"
  'invalid_index_name_exception',
]

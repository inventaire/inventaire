import { uniq, flatten } from 'lodash-es'
import { getEntityByUri } from '#controllers/entities/lib/get_entity_by_uri'
import properties from '#controllers/entities/lib/properties/properties_values_constraints'
import getEntityIdBySitelink from '#data/wikidata/get_entity_id_by_sitelink'
import { assert_ } from '#lib/utils/assert_types'
import { warn } from '#lib/utils/logs'

// Accepts several string arguments, either as single URLs or as a group of urls concatenated with ',' as separator
export async function parseSameasMatches ({ matches, expectedEntityType }) {
  assert_.array(matches)
  assert_.string(expectedEntityType)

  matches = flatten(matches)
    .filter(match => match != null && match !== '')
    .map(match => match.trim().split(','))

  const urls = uniq(flatten(matches))
  if (urls.length === 0) return {}
  const entryData = { claims: {} }

  for (const url of urls) {
    const { property, value } = await getUrlData(url)
    if (value) {
      await setFoundValue(entryData, property, value, expectedEntityType)
    }
  }

  return entryData
}

const setFoundValue = async (entryData, property, value, expectedEntityType) => {
  if (property !== 'uri') {
    entryData.claims[property] = value
    return
  }
  // Wikidata edition entities should not be used until
  // https://github.com/inventaire/inventaire/issues/182 is resolved
  if (expectedEntityType === 'edition') return
  const uri = value
  const { type } = await getEntityByUri({ uri })
  if (type !== expectedEntityType) {
    return warn({ entryData, property, value, type, expectedEntityType }, 'type mismatch')
  }
  entryData.uri = uri
}

const getUrlData = async url => {
  const { host, pathname } = new URL(url)
  let urlData
  if (wikipediaOrDbpediaHostPattern.test(host)) {
    urlData = await getPropertyAndIdFromWikipediaOrDbpedia(host, pathname)
  } else {
    urlData = getPropertyAndIdPerHost[host]?.(pathname)
  }
  return urlData || {}
}

const wikipediaOrDbpediaHostPattern = /^\w{2,8}\.(wikipedia|dbpedia)\.org$/

const getPropertyAndIdPerHost = {
  'bnb.data.bl.uk': pathname => {
    const [ section, id ] = pathname.split('/').slice(2)
    // Validation is required to filter-out ids that look like 'GBA446176'
    if (section === 'resource' && properties['wdt:P5199'].validate(id)) {
      return { property: 'wdt:P5199', value: id }
    }
    if (section === 'person') return { property: 'wdt:P5361', value: id }
  },
  'datos.bne.es': pathname => ({ property: 'wdt:P950', value: pathname.split('/')[2] }),
  'data.bnf.fr': pathname => ({
    property: 'wdt:P268',
    // Known case where the replace won't be possible: temp works
    // Ex: https://data.bnf.fr/temp-work/ef36a038d0abd4038d662bb01ddcbb76/#about
    value: pathname.split('/cb')[1]?.replace('#about', ''),
  }),
  'd-nb.info': pathname => ({ property: 'wdt:P227', value: pathname.split('/')[2] }),
  'id.loc.gov': pathname => ({ property: 'wdt:P244', value: pathname.split('/')[3] }),
  'isni.org': pathname => ({ property: 'wdt:P213', value: pathname.split('/')[2] }),
  'libris.kb.se': pathname => ({ property: 'wdt:P906', value: pathname.split('/')[3] }),
  'viaf.org': pathname => ({ property: 'wdt:P214', value: pathname.split('/')[2] }),
  'wikidata.org': pathname => ({ property: 'uri', value: `wd:${pathname.split('/')[2]}` }),
  'www.idref.fr': pathname => ({ property: 'wdt:P269', value: pathname.split('/')[1] }),
}

getPropertyAndIdPerHost['isni-url.oclc.nl'] = getPropertyAndIdPerHost['isni.org']

const getPropertyAndIdFromWikipediaOrDbpedia = async (host, pathname) => {
  const lang = host.split('.')[0]
  const title = pathname.split('/')[2]
  const id = await getEntityIdBySitelink({ site: `${lang}wiki`, title })
  if (id) return { property: 'uri', value: `wd:${id}` }
}

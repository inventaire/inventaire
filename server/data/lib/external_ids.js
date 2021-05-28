const { uniq } = require('lodash')
const getEntityIdBySitelink = require('data/wikidata/get_entity_id_by_sitelink')
const properties = require('controllers/entities/lib/properties/properties_values_constraints')

const parseSameAsMatches = async matches => {
  if (!matches) return {}
  matches = matches.replace(/^,/, '').trim()
  if (matches === '') return {}
  const entryData = { claims: {} }
  const urls = uniq(matches.split(','))
  for (const url of urls) {
    const { property, value } = await getUrlData(url)
    if (value) {
      if (property === 'uri') entryData.uri = value
      else entryData.claims[property] = value
    }
  }
  return entryData
}

const getUrlData = async url => {
  const { host, pathname } = new URL(url)
  const urlData = await getPropertyAndIdPerHost[host]?.(pathname)
  return urlData || {}
}

const getPropertyAndIdPerHost = {
  'bnb.data.bl.uk': pathname => {
    const [ section, id ] = pathname.split('/').slice(2)
    // Validation is required to filter-out ids that look like 'GBA446176'
    if (section === 'resource' && properties['wdt:P5199'].validate(id)) {
      return { property: 'wdt:P5199', value: id }
    }
    if (section === 'person') return { property: 'wdt:P5361', value: id }
  },
  'data.bnf.fr': pathname => ({
    property: 'wdt:P268',
    // Known case where the replace won't be possible: temp works
    // Ex: https://data.bnf.fr/temp-work/ef36a038d0abd4038d662bb01ddcbb76/#about
    value: pathname.split('/cb')[1]?.replace('#about', '')
  }),
  'fr.dbpedia.org': async pathname => {
    const title = pathname.split('/')[2]
    const id = await getEntityIdBySitelink({ site: 'frwiki', title })
    if (id) return { property: 'uri', value: `wd:${id}` }
  },
  'isni.org': pathname => ({ property: 'wdt:P213', value: pathname.split('/')[2] }),
  'viaf.org': pathname => ({ property: 'wdt:P214', value: pathname.split('/')[2] }),
  'wikidata.org': pathname => ({ property: 'uri', value: `wd:${pathname.split('/')[2]}` }),
  'www.idref.fr': pathname => ({ property: 'wdt:P269', value: pathname.split('/')[1] }),
}

module.exports = { parseSameAsMatches }

const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const getEntityByUri = __.require('controllers', 'entities/lib/get_entity_by_uri')
const getEntitiesList = __.require('controllers', 'entities/lib/get_entities_list')

module.exports = async item => {
  const { entity: uri } = item
  const entity = await getEntityByUri({ uri })

  let works
  if (entity.type === 'edition') {
    item.edition = entity
    item.publisherUri = entity.claims['wdt:P123'] && entity.claims['wdt:P123'][0]
    if (item.publisherUri) {
      item.publisher = await getEntityByUri({ uri: item.publisherUri })
    }
    item.translatorsUris = entity.claims['wdt:P655']
    if (item.translatorsUris) {
      item.translators = await getEntitiesList(item.translatorsUris)
    }
    item.editionLangUri = entity.claims['wdt:P407'] && entity.claims['wdt:P407'][0]
    if (item.editionLangUri) {
      item.editionLang = await getEntityByUri({ uri: item.editionLangUri })
    }
    item.worksUris = entity.claims['wdt:P629']
    works = await getEntitiesList(item.worksUris)
  } else if (entity.type === 'work') {
    item.worksUris = [ uri ]
    works = [ entity ]
  } else {
    // Known case: if an item is associated to an Wikidata entity which type was changed
    throw error_.new('invalid item entity type', 500, { item, entity })
  }

  item.works = works
  item.authorsUris = aggregateWorks(works, getWorkAuthorsUris)
  item.seriesUris = aggregateWorks(works, getWorkSeriesUris)
  item.genresUris = aggregateWorks(works, getWorkGenresUris)
  item.subjectsUris = aggregateWorks(works, getWorkSubjetsUris)
  item.originalLangsUris = aggregateWorks(works, getWorkOriginalLangsUris)

  const [ authors, series, genres, subjects, originalLangs ] = await Promise.all([
    getEntitiesList(item.authorsUris),
    getEntitiesList(item.seriesUris),
    getEntitiesList(item.genresUris),
    getEntitiesList(item.subjectsUris),
    getEntitiesList(item.originalLangsUris)
  ])

  item.authors = authors
  item.series = series
  item.genres = genres
  item.subjects = subjects
  item.originalLangs = originalLangs

  return item
}

const aggregateWorks = (works, getWorkEntitiesUris) => {
  return _.deepCompact(works.map(getWorkEntitiesUris))
}

const getWorkAuthorsUris = work => _.flatten(_.values(_.pick(work.claims, authorProperties)))
const authorProperties = [
  'wdt:P50',
  'wdt:P58',
  'wdt:P110',
  'wdt:P6338'
]
const getWorkSeriesUris = work => work.claims['wdt:P179']
const getWorkGenresUris = work => work.claims['wdt:P136']
const getWorkSubjetsUris = work => work.claims['wdt:P921']
const getWorkOriginalLangsUris = work => work.claims['wdt:P407']

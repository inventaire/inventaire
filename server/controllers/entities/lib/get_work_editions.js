const _ = require('builders/utils')
const { byClaim } = require('./entities')
const getOriginalLang = require('lib/wikidata/get_original_lang')
const { getEntitiesPopularities } = require('./popularity')
const getInvUriFromDoc = require('./get_inv_uri_from_doc')
const editionLangProperty = 'wdt:P407'

module.exports = async ({ uri }) => {
  const editionsDocs = await byClaim('wdt:P629', uri, true, true)
  const editionsData = editionsDocs.map(getEditionSummaryData)
  await addPopularities(editionsData)
  return { editions: editionsData.sort(byScore) }
}

const getEditionSummaryData = edition => ({
  uri: getInvUriFromDoc(edition),
  lang: getOriginalLang(edition.claims, editionLangProperty)
})

const addPopularities = async editionsData => {
  const uris = _.map(editionsData, 'uri')
  const popularities = await getEntitiesPopularities({ uris })
  for (const editionData of editionsData) {
    editionData.score = popularities[editionData.uri]
  }
}

const byScore = (a, b) => b.score - a.score

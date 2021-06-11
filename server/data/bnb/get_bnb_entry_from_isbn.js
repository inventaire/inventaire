const qs = require('querystring')
const parseIsbn = require('lib/isbn/parse')
const requests_ = require('lib/requests')
const { sparqlResults: simplifySparqlResults } = require('wikidata-sdk').simplify
const cache_ = require('lib/cache')
const { hashCode } = require('lib/utils/base')
const { parseSameAsMatches } = require('data/lib/external_ids')
const wdIdByIso6393Code = require('wikidata-lang/mappings/wd_id_by_iso_639_3_code.json')
const { buildEntryFromFormattedRows } = require('data/lib/build_entry_from_formatted_rows')
const { prefixifyWd } = require('controllers/entities/lib/prefix')

module.exports = async isbn => {
  const queryHash = hashCode(getQuery(isbn)) + Math.random()
  const key = `bnb-seed:${isbn}:${queryHash}`
  const response = await cache_.get({
    key,
    fn: get.bind(null, isbn)
  })
  const simplifiedResults = simplifySparqlResults(response)
  const { bindings: rawResults } = response.results
  const rows = await Promise.all(simplifiedResults.map((result, i) => {
    return formatRow(isbn, result, rawResults[i])
  }))
  return buildEntryFromFormattedRows(rows, getSourceId)
}

const getSourceId = entity => entity.claims?.['wdt:P5199'] || entity.claims?.['wdt:P5361']

const headers = {
  'content-type': 'application/sparql-query',
  accept: 'application/sparql-results+json',
}

const get = async isbn => {
  const url = `https://bnb.data.bl.uk/sparql?format=json&query=${getQuery(isbn)}`
  return requests_.get(url, { headers })
}

const getQuery = isbn => {
  const isbnData = parseIsbn(isbn)
  if (!isbnData) throw new Error(`invalid isbn: ${isbn}`)
  const { isbn10, isbn13 } = isbnData
  const query = `
  PREFIX schema: <http://schema.org/>
  PREFIX dcterms: <http://purl.org/dc/terms/>
  PREFIX foaf: <http://xmlns.com/foaf/0.1/>
  PREFIX owl: <http://www.w3.org/2002/07/owl#>

  SELECT DISTINCT ?edition ?editionTitle ?editionPublicationDate ?editionLang ?author ?authorLabel ?authorBirth ?authorDeath (GROUP_CONCAT(?editionMatch;separator=",") AS ?editionMatches) (GROUP_CONCAT(?authorMatch;separator=",") AS ?authorMatches) WHERE {
    { ?edition schema:isbn "${isbn10}" }
    UNION { ?edition schema:isbn "${isbn13}" }

    OPTIONAL { ?edition dcterms:title ?editionTitle }
    OPTIONAL { ?edition schema:datePublished ?datePublished }
    OPTIONAL { ?edition dcterms:language ?editionLang }
    OPTIONAL { ?edition owl:sameAs ?editionMatch . }

    OPTIONAL {
      ?edition dcterms:creator ?author .
      OPTIONAL { ?author foaf:name ?authorLabel . }
      OPTIONAL { ?author schema:birthDate ?authorBirth . }
      OPTIONAL { ?author schema:deathDate ?authorDeath . }
      OPTIONAL { ?author owl:sameAs ?authorMatch . }
    }
  }
  `
  return qs.escape(query)
}

const formatRow = async (isbn, result, rawResult) => {
  const { edition, author } = result
  const entry = {}
  entry.edition = { isbn }
  if (edition) {
    const { claims } = await parseSameAsMatches(edition.value, edition.matches)
    entry.edition.claims = {
      'wdt:P1476': edition.title,
      ...claims
    }
    const iso6393Lang = edition.lang?.replace('http://lexvo.org/id/iso639-3/', '')
    if (edition.lang && wdIdByIso6393Code[iso6393Lang]) {
      entry.edition.claims['wdt:P407'] = prefixifyWd(wdIdByIso6393Code[iso6393Lang])
    }
  }
  if (author) {
    const { uri, claims } = await parseSameAsMatches(author.value, author.matches)
    entry.author = {
      uri,
      labels: { fr: author.label },
      claims
    }
    if (author.birth) entry.author.claims['wdt:P569'] = author.birth
    if (author.death) entry.author.claims['wdt:P570'] = author.death
  }
  return entry
}

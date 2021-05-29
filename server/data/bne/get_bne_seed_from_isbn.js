const qs = require('querystring')
const parseIsbn = require('lib/isbn/parse')
const requests_ = require('lib/requests')
const { sparqlResults: simplifySparqlResults } = require('wikidata-sdk').simplify
const cache_ = require('lib/cache')
const { hashCode } = require('lib/utils/base')
const { parseSameAsMatches } = require('data/lib/external_ids')
const wdIdByIso6392Code = require('wikidata-lang/mappings/wd_id_by_iso_639_2_code.json')
const { buildEntryFromFormattedRows } = require('data/lib/build_entry_from_formatted_rows')
const { isPositiveIntegerString } = require('lib/boolean_validations')
const { setEditionPublisherClaim } = require('data/lib/set_edition_publisher_claim')

module.exports = async isbn => {
  const queryHash = hashCode(getQuery(isbn)) + Math.random()
  const key = `bne-seed:${isbn}:${queryHash}`
  const response = await cache_.get({
    key,
    fn: get.bind(null, isbn)
  })
  const simplifiedResults = simplifySparqlResults(response)
  const { bindings: rawResults } = response.results
  const rows = await Promise.all(simplifiedResults.map((result, i) => {
    return formatRow(isbn, result, rawResults[i])
  }))
  const entry = buildEntryFromFormattedRows(rows, getSourceId)
  await setEditionPublisherClaim(entry)
  return entry
}

const getSourceId = entity => entity.claims?.['wdt:P905']

const headers = {
  'content-type': 'application/sparql-query',
  accept: 'application/sparql-results+json',
}

const get = async isbn => {
  const url = `https://datos.bne.es/sparql?timeout=10000&debug=true&format=json&query=${getQuery(isbn)}`
  return requests_.get(url, { headers, ignoreCertificateErrors: true })
}

const getQuery = isbn => {
  const isbnData = parseIsbn(isbn)
  if (!isbnData) throw new Error(`invalid isbn: ${isbn}`)
  const { isbn10, isbn13, isbn10h, isbn13h } = isbnData
  const query = `
  PREFIX dcterms: <http://purl.org/dc/terms/>
  PREFIX bnep: <http://datos.bne.es/def/>

  SELECT DISTINCT ?edition ?editionTitle ?editionSubtitle ?editionPages ?editionLang ?editionPublicationDate ?publisherLabel ?authorLabel WHERE {
    { ?edition bnep:P3013 "${isbn10}" }
    UNION { ?edition bnep:P3013 "${isbn13}" }
    UNION { ?edition bnep:P3013 "${isbn10h}" }
    UNION { ?edition bnep:P3013 "${isbn13h}" }

    OPTIONAL { ?edition bnep:P3002 ?editionTitle }
    OPTIONAL { ?edition bnep:P3014 ?editionSubtitle }
    OPTIONAL { ?edition bnep:P3004 ?editionPages }
    OPTIONAL { ?edition bnep:P3001 ?publisherLabel }
    OPTIONAL { ?edition bnep:P3006 ?editionPublicationDate }
    OPTIONAL { ?edition dcterms:language ?editionLang }
    OPTIONAL { ?edition bnep:P1011 ?authorLabel }
  }`
  return qs.escape(query)
}

const formatRow = async (isbn, result, rawResult) => {
  const { edition, authorLabel, publisherLabel } = result
  const entry = {}
  entry.edition = { isbn }
  if (edition) {
    const { claims } = await parseSameAsMatches(edition.value)
    entry.edition.claims = {
      'wdt:P1476': edition.title,
      ...claims
    }
    const iso6392Lang = edition.lang?.replace('http://id.loc.gov/vocabulary/languages/', '')
    if (edition.lang && wdIdByIso6392Code[iso6392Lang]) {
      entry.edition.claims['wdt:P407'] = wdIdByIso6392Code[iso6392Lang]
    }
    if (edition.pages) {
      const pages = edition.pages.replace(' p.', '')
      if (isPositiveIntegerString(pages)) entry.edition.claims['wdt:P1104'] = parseInt(pages)
    }
    if (edition.publicationDate?.match(yearPattern)) {
      const publicationYear = edition.publicationDate.match(yearPattern)[1]
      entry.edition.claims['wdt:P577'] = publicationYear
    }
  }
  if (authorLabel) {
    entry.author = {
      labels: { es: authorLabel },
    }
  }
  if (publisherLabel) {
    entry.publisher = {
      labels: { es: publisherLabel }
    }
  }
  return entry
}

const yearPattern = /([12]\d{3})/

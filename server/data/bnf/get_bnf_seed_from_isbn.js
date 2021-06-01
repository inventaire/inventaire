const qs = require('querystring')
const parseIsbn = require('lib/isbn/parse')
const requests_ = require('lib/requests')
const { sparqlResults: simplifySparqlResults } = require('wikidata-sdk').simplify
const cache_ = require('lib/cache')
const { hashCode } = require('lib/utils/base')
const fetch = require('node-fetch')
const wdIdByIso6392Code = require('wikidata-lang/mappings/wd_id_by_iso_639_2_code.json')
const wmCodeByIso6392Code = require('wikidata-lang/mappings/wm_code_by_iso_639_2_code.json')
const { prefixifyWd } = require('controllers/entities/lib/prefix')
const { parseSameAsMatches } = require('data/lib/external_ids')
const { buildEntryFromFormattedRows } = require('data/lib/build_entry_from_formatted_rows')
const { setEditionPublisherClaim } = require('data/lib/set_edition_publisher_claim')

module.exports = async isbn => {
  const queryHash = hashCode(getQuery(isbn))
  const key = `bnf-seed:${isbn}:${queryHash}`
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
  await addImage(entry)
  return entry
}

const headers = { accept: '*/*' }

const base = 'https://data.bnf.fr/sparql?default-graph-uri=&format=json&timeout=60000&query='
const get = async isbn => {
  const url = base + getQuery(isbn)
  return requests_.get(url, { headers })
}

const getQuery = isbn => {
  const isbnData = parseIsbn(isbn)
  if (!isbnData) throw new Error(`invalid isbn: ${isbn}`)
  const { isbn10h, isbn13h, isbn13 } = isbnData
  const query = `SELECT DISTINCT ?edition ?editionTitle ?editionPublicationDate ?work ?workLabel ?workPublicationDate ?author ?authorLabel ?expressionLang ?publisherLabel (GROUP_CONCAT(?editionMatch;separator=",") AS ?editionMatches) (GROUP_CONCAT(?workMatch;separator=",") AS ?workMatches) (GROUP_CONCAT(?authorMatch;separator=",") AS ?authorMatches) WHERE {

  { ?edition bnf-onto:isbn "${isbn10h}" }
  UNION { ?edition bnf-onto:isbn "${isbn13h}" }
  UNION { ?edition bnf-onto:ean "${isbn13}" }

  OPTIONAL{ ?edition dcterms:date ?editionPublicationDate }
  OPTIONAL{ ?edition dcterms:title ?editionTitle }
  OPTIONAL{ ?edition rdagroup1elements:publishersName ?publisherLabel }

  OPTIONAL {
    { ?edition owl:sameAs ?editionMatch . } UNION { ?edition skos:exactMatch ?editionMatch . }
  }

  OPTIONAL {
    ?edition rdarelationships:expressionManifested ?expression_a .
    ?expression_a dcterms:language ?expressionLang .
  }

  OPTIONAL {
    ?edition rdarelationships:workManifested ?work .

    OPTIONAL {
      { ?work owl:sameAs ?workMatch . } UNION { ?work skos:exactMatch ?workMatch . }
    }
    OPTIONAL { ?work dcterms:title ?workLabel }
    OPTIONAL { ?work bnf-onto:firstYear ?workPublicationDate }
  }

  OPTIONAL {
    {
      ?edition rdarelationships:workManifested ?work .
      ?work dcterms:creator ?author .
    } UNION {
      ?edition rdarelationships:expressionManifested ?expression_b .
      ?expression_b marcrel:aut ?author .
    }
    OPTIONAL {
      ?author foaf:name ?authorLabel .
    }
    OPTIONAL {
      { ?author owl:sameAs ?authorMatch . }
      UNION { ?author skos:exactMatch ?authorMatch . }
      UNION {
        ?author foaf:Person ?person .
        { ?person owl:sameAs ?authorMatch . } UNION { ?person skos:exactMatch ?authorMatch . }
      }
    }
  }
}
GROUP BY ?edition ?editionTitle ?editionPublicationDate ?work ?workLabel ?workPublicationDate ?author ?authorLabel ?expressionLang ?publisherLabel`
  return qs.escape(query)
}

const formatRow = async (isbn, result, rawResult) => {
  const { edition, work, author, publisherLabel } = result
  const expressionLang = result.expressionLang.replace('http://id.loc.gov/vocabulary/iso639-2/', '')
  const workLabelLang = rawResult.workLabel?.['xml:lang'] || wmCodeByIso6392Code[expressionLang]
  if (workLabelLang) result.work.labelLang = workLabelLang
  const entry = {}
  entry.edition = { isbn }
  if (edition) {
    const { claims } = await parseSameAsMatches(edition.value, edition.matches)
    entry.edition.claims = {
      'wdt:P1476': edition.title,
      ...claims
    }
    if (expressionLang && wdIdByIso6392Code[expressionLang]) {
      entry.edition.claims['wdt:P407'] = prefixifyWd(wdIdByIso6392Code[expressionLang])
    }
  }
  if (work.value) {
    const { uri, claims } = await parseSameAsMatches(work.value, work.matches)
    entry.work = {
      uri,
      labels: {
        [work.labelLang]: work.label
      },
      claims
    }
    if (work.value.includes('temp-work')) entry.work.tempBnfId = work.value
  }
  if (author.value) {
    const { uri, claims } = await parseSameAsMatches(author.value, author.matches)
    entry.author = {
      uri,
      labels: { fr: author.label },
      claims
    }
  }
  if (publisherLabel) {
    entry.publisher = {
      labels: { fr: publisherLabel }
    }
  }
  return entry
}

const getSourceId = entity => entity.claims?.['wdt:P268'] || entity.tempBnfId || entity.labels?.fr

const addImage = async entry => {
  const bnfId = entry?.edition.claims['wdt:P268']
  if (!bnfId) return
  const url = `https://catalogue.bnf.fr/couverture?appName=NE&idArk=ark:/12148/cb${bnfId}&couverture=1`
  const { status: statusCode, headers } = await fetch(url)
  let contentLength = headers.get('content-length')
  if (contentLength) contentLength = parseInt(contentLength)
  if (statusCode === 200 && contentLength !== placeholderContentLength) {
    entry.edition.image = url
  }
}

const placeholderContentLength = 4566

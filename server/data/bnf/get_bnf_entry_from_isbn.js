const { fixedEncodeURIComponent } = require('lib/utils/url')
const parseIsbn = require('lib/isbn/parse')
const requests_ = require('lib/requests')
const { sparqlResults: simplifySparqlResults } = require('wikidata-sdk').simplify
const wdIdByIso6392Code = require('wikidata-lang/mappings/wd_id_by_iso_639_2_code.json')
const wmCodeByIso6392Code = require('wikidata-lang/mappings/wm_code_by_iso_639_2_code.json')
const { prefixifyWd } = require('controllers/entities/lib/prefix')
const { parseSameasMatches } = require('data/lib/external_ids')
const { buildEntryFromFormattedRows } = require('data/lib/build_entry_from_formatted_rows')
const { setEditionPublisherClaim } = require('data/lib/set_edition_publisher_claim')
const { formatAuthorName } = require('data/commons/format_author_name')
// Using a shorter timeout as the query is never critically needed but can make a user wait
const timeout = 10000

const headers = { accept: '*/*' }
const base = `https://data.bnf.fr/sparql?default-graph-uri=&format=json&timeout=${timeout}&query=`

module.exports = async isbn => {
  const url = base + getQuery(isbn)
  const response = await requests_.get(url, { headers, timeout })
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
  return fixedEncodeURIComponent(query)
}

const formatRow = async (isbn, result, rawResult) => {
  const { edition, work, author, publisherLabel } = result
  const expressionLang = result.expressionLang?.replace('http://id.loc.gov/vocabulary/iso639-2/', '')
  const workLabelLang = rawResult.workLabel?.['xml:lang'] || wmCodeByIso6392Code[expressionLang]
  if (workLabelLang) result.work.labelLang = workLabelLang
  const entry = {}
  entry.edition = { isbn }
  if (edition) {
    const { claims } = await parseSameasMatches({
      matches: [ edition.value, edition.matches ],
      expectedEntityType: 'edition'
    })
    entry.edition.claims = {
      'wdt:P1476': edition.title,
      'wdt:P577': edition.publicationDate,
      ...claims
    }
    if (expressionLang && wdIdByIso6392Code[expressionLang]) {
      entry.edition.claims['wdt:P407'] = prefixifyWd(wdIdByIso6392Code[expressionLang])
    }
  }
  if (work.value) {
    const { uri, claims } = await parseSameasMatches({
      matches: [ work.value, work.matches ],
      expectedEntityType: 'work'
    })
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
    const { uri, claims } = await parseSameasMatches({
      matches: [ author.value, author.matches ],
      expectedEntityType: 'human'
    })
    entry.author = {
      uri,
      labels: { fr: formatAuthorName(author.label) },
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
  const { statusCode, headers } = await requests_.head(url)
  let { 'content-length': contentLength } = headers
  if (contentLength) contentLength = parseInt(contentLength)
  if (statusCode === 200 && !placeholderContentLengths.includes(contentLength)) {
    entry.edition.image = url
  }
}

const placeholderContentLengths = [
  4566,
  4658,
]

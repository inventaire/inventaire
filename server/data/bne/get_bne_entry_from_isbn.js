import wdk from 'wikidata-sdk'
import { prefixifyWd } from '#controllers/entities/lib/prefix'
import { formatAuthorName } from '#data/commons/format_author_name'
import { buildEntryFromFormattedRows } from '#data/lib/build_entry_from_formatted_rows'
import { parseSameasMatches } from '#data/lib/external_ids'
import { setEditionPublisherClaim } from '#data/lib/set_edition_publisher_claim'
import { isPositiveIntegerString } from '#lib/boolean_validations'
import { parseIsbn } from '#lib/isbn/parse'
import { requests_ } from '#lib/requests'
import { requireJson } from '#lib/utils/json'
import { fixedEncodeURIComponent } from '#lib/utils/url'

const wdIdByIso6392Code = requireJson('wikidata-lang/mappings/wd_id_by_iso_639_2_code.json')

const { simplifySparqlResults } = wdk
// Using a shorter timeout as the query is never critically needed but can make a user wait
const timeout = 10000

const headers = {
  'content-type': 'application/sparql-query',
  accept: 'application/sparql-results+json',
}

export default async isbn => {
  const url = `https://datos.bne.es/sparql?timeout=${timeout}&format=json&query=${getQuery(isbn)}`
  const response = await requests_.get(url, { headers, timeout })
  let simplifiedResults = simplifySparqlResults(response)
  // Work around the absence of support for GROUP_CONCAT
  simplifiedResults = regroupSameAsMatches(simplifiedResults)
  const rows = await Promise.all(simplifiedResults.map(result => formatRow(isbn, result)))
  const entry = buildEntryFromFormattedRows(rows, getSourceId)
  await setEditionPublisherClaim(entry)
  return entry
}

const getSourceId = entity => entity.claims?.['wdt:P905']

const getQuery = isbn => {
  const isbnData = parseIsbn(isbn)
  if (!isbnData) throw new Error(`invalid isbn: ${isbn}`)
  const { isbn10, isbn13, isbn10h, isbn13h } = isbnData
  // Virtuoso 37000 doesn't support GROUP_CONCAT
  const query = `
  PREFIX dcterms: <http://purl.org/dc/terms/>
  PREFIX bnep: <http://datos.bne.es/def/>
  PREFIX owl: <http://www.w3.org/2002/07/owl#>
  PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

  SELECT DISTINCT ?edition ?editionTitle ?editionSubtitle ?editionPages ?editionLang ?editionPublicationDate ?publisherLabel ?author ?authorLabel ?authorBirth ?authorDeath ?authorMatch WHERE {
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
    OPTIONAL {
      ?edition bnep:OP3003 ?author .
      OPTIONAL {
        { ?author owl:sameAs ?authorMatch . }
        UNION { ?author rdfs:seeAlso ?authorMatch . }
      }
      OPTIONAL { ?author bnep:P5010 ?authorBirth . }
      OPTIONAL { ?author bnep:P5011 ?authorDeath . }
    }
  }`
  return fixedEncodeURIComponent(query)
}

const formatRow = async (isbn, result) => {
  const { edition, author, publisherLabel } = result
  const entry = {}
  entry.edition = { isbn }
  if (edition) {
    const { claims } = await parseSameasMatches({
      matches: [ edition.value ],
      expectedEntityType: 'edition',
    })
    entry.edition.claims = {
      'wdt:P1476': edition.title,
      ...claims,
    }
    const iso6392Lang = edition.lang?.replace('http://id.loc.gov/vocabulary/languages/', '')
    if (edition.lang && wdIdByIso6392Code[iso6392Lang]) {
      entry.edition.claims['wdt:P407'] = prefixifyWd(wdIdByIso6392Code[iso6392Lang])
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
  if (author) {
    const { uri, claims } = await parseSameasMatches({
      matches: [ author.value, author.matches ],
      expectedEntityType: 'human',
    })
    entry.author = {
      uri,
      labels: { es: formatAuthorName(author.label) },
      claims,
    }
    if (author.birth) entry.author.claims['wdt:P569'] = author.birth
    if (author.death) entry.author.claims['wdt:P570'] = author.death
  }
  if (publisherLabel) {
    entry.publisher = {
      labels: { es: publisherLabel },
    }
  }
  return entry
}

const yearPattern = /([12]\d{3})/

const regroupSameAsMatches = simplifiedResults => {
  const authorsMatches = {}
  simplifiedResults.forEach(({ author }) => {
    if (author?.match) {
      authorsMatches[author.value] = authorsMatches[author.value] || []
      authorsMatches[author.value].push(author.match)
    }
  })
  simplifiedResults.forEach(({ author }) => {
    if (author && authorsMatches[author.value]) {
      author.matches = authorsMatches[author.value]
    }
  })
  const editionAuthorCouples = []
  return simplifiedResults.filter(result => {
    const editionAuthorCouple = `${result.edition.value}+${result.author?.value}`
    if (editionAuthorCouples.includes(editionAuthorCouple)) return false
    editionAuthorCouples.push(editionAuthorCouple)
    return true
  })
}

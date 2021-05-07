const _ = require('builders/utils')
const qs = require('querystring')
const parseIsbn = require('lib/isbn/parse')
const requests_ = require('lib/requests')
const { sparqlResults: simplifySparqlResults } = require('wikidata-sdk').simplify
const cache_ = require('lib/cache')

module.exports = async isbn => {
  const key = `bnf-seed:${isbn}`
  const results = await cache_.get({
    key,
    fn: get.bind(null, isbn)
  })
  const simplifiedResults = simplifySparqlResults(results)
  if (simplifiedResults.length !== 1) return

  const result = simplifiedResults[0]
  const workLabelLang = results.results.bindings[0].workLabel?.['xml:lang']
  if (workLabelLang) result.work.labelLang = workLabelLang
  const entry = convertResultToResolverEntry(isbn, result)
  return entry
}

const get = async isbn => {
  const url = getUrl(isbn)
  return requests_.get(url, {
    headers: {
      accept: '*/*'
    }
  })
}

const base = 'https://data.bnf.fr/sparql?default-graph-uri=&format=json&timeout=60000&query='
const getUrl = isbn => base + getQuery(isbn)

const getQuery = isbn => {
  const { isbn10h, isbn13h, isbn13 } = parseIsbn(isbn)
  const query = `SELECT ?edition ?editionTitle ?editionPublicationDate ?work ?workLabel ?workPublicationDate ?author ?authorLabel ?publisherLabel (GROUP_CONCAT(?workMatch;separator="|") AS ?workMatches) (GROUP_CONCAT(?authorMatch;separator="|") AS ?authorMatches) WHERE {

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
    ?edition rdarelationships:workManifested ?work .

    OPTIONAL {
      { ?work owl:sameAs ?workMatch . } UNION { ?work skos:exactMatch ?workMatch . }
    }
    OPTIONAL { ?work dcterms:title ?workLabel }
    OPTIONAL { ?work bnf-onto:firstYear ?workPublicationDate }
    OPTIONAL {
      ?work dcterms:creator ?author .
      ?author foaf:name ?authorLabel
      OPTIONAL {
        { ?author owl:sameAs ?authorMatch . } UNION { ?author skos:exactMatch ?authorMatch . }
      }
    }
  }
}
GROUP BY ?edition ?editionTitle ?editionPublicationDate ?work ?workLabel ?workPublicationDate ?author ?authorLabel ?publisherLabel
`
  return qs.escape(query)
}

const convertResultToResolverEntry = (isbn, result) => {
  const { edition, work, author, publisherLabel } = result
  const entry = {}
  entry.edition = { isbn }
  if (edition) {
    const { claims } = parseMatches(edition.matches)
    entry.edition.claims = {
      P268: getBnfId(edition.value),
      P1476: edition.title,
      ...claims
    }
  }
  if (work) {
    const { id, claims } = parseMatches(work.matches)
    entry.work = {
      id,
      labels: {
        [work.labelLang]: work.label
      },
      claims
    }
    const bnfId = getBnfId(work.value)
    if (bnfId) entry.work.claims.P268 = bnfId
  }
  if (author) {
    const { id, claims } = parseMatches(author.matches)
    entry.author = {
      id,
      labels: { fr: author.label },
      claims
    }
    const bnfId = getBnfId(author.value)
    if (bnfId) entry.author.claims.P268 = bnfId
  }
  if (publisherLabel) {
    entry.publisher = {
      labels: { fr: publisherLabel }
    }
  }
  return entry
}

// Known case where the replace won't be possible: temp works
// Ex: https://data.bnf.fr/temp-work/ef36a038d0abd4038d662bb01ddcbb76/#about
const getBnfId = url => url?.split('/cb')[1]?.replace('#about', '')

const parseMatches = matches => {
  if (!matches || matches === '') return {}
  const data = { claims: {} }
  const urls = _.uniq(matches.split('|'))
  urls.forEach(url => {
    const { host, pathname } = new URL(url)
    if (getPropertyAndIdPerHost[host]) {
      const { property, value } = getPropertyAndIdPerHost[host](pathname)
      if (property === 'id') data.id = value
      else data.claims[property] = value
    }
  })
  return data
}

const getPropertyAndIdPerHost = {
  'viaf.org': pathname => ({ property: 'P214', value: pathname.split('/')[3] }),
  'wikidata.org': pathname => ({ property: 'id', value: pathname.split('/')[2] }),
  'www.idref.fr': pathname => ({ property: 'P269', value: pathname.split('/')[1] }),
}

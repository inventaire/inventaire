const _ = require('builders/utils')
const qs = require('querystring')
const parseIsbn = require('lib/isbn/parse')
const requests_ = require('lib/requests')
const { sparqlResults: simplifySparqlResults } = require('wikidata-sdk').simplify
const cache_ = require('lib/cache')
const { hashCode } = require('lib/utils/base')
const getEntityIdBySitelink = require('data/wikidata/get_entity_id_by_sitelink')
const { resolvePublisher } = require('controllers/entities/lib/resolver/resolve_publisher')
const fetch = require('node-fetch')
const wdIdByIso6392Code = require('wikidata-lang/mappings/wd_id_by_iso_639_2_code.json')
const wmCodeByIso6392Code = require('wikidata-lang/mappings/wm_code_by_iso_639_2_code.json')
const { prefixifyWd } = require('controllers/entities/lib/prefix')

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

  const entry = regroupRows(rows)
  if (entry?.publishers) {
    await addPublisherUri(entry)
    delete entry.publishers
  }
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
  const query = `SELECT ?edition ?editionTitle ?editionPublicationDate ?work ?workLabel ?workPublicationDate ?author ?authorLabel ?expressionLang ?publisherLabel (GROUP_CONCAT(?editionMatch;separator=",") AS ?editionMatches) (GROUP_CONCAT(?workMatch;separator=",") AS ?workMatches) (GROUP_CONCAT(?authorMatch;separator=",") AS ?authorMatches) WHERE {

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
    ?edition rdarelationships:expressionManifested ?expression .
    ?expression dcterms:language ?expressionLang .
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
      ?edition rdarelationships:expressionManifested ?expression .
      ?expression marcrel:aut ?author .
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
  entry.edition = { isbn, sameAs: [ edition.value ] }
  if (edition) {
    const { claims } = await parseMatches(edition.matches)
    entry.edition.claims = {
      'wdt:P268': getBnfId(edition.value),
      'wdt:P1476': edition.title,
      ...claims
    }
    if (expressionLang && wdIdByIso6392Code[expressionLang]) {
      entry.edition.claims['wdt:P407'] = prefixifyWd(wdIdByIso6392Code[expressionLang])
    }
  }
  if (work.value) {
    const { uri, claims } = await parseMatches(work.matches)
    entry.work = {
      uri,
      sameAs: [ work.value ],
      labels: {
        [work.labelLang]: work.label
      },
      claims
    }
    const bnfId = getBnfId(work.value)
    if (bnfId) entry.work.claims['wdt:P268'] = bnfId
    else if (work.value.includes('temp-work')) entry.work.tempBnfId = work.value
  }
  if (author.value) {
    const { uri, claims } = await parseMatches(author.matches)
    entry.author = {
      uri,
      sameAs: [ author.value ],
      labels: { fr: author.label },
      claims
    }
    const bnfId = getBnfId(author.value)
    if (bnfId) entry.author.claims['wdt:P268'] = bnfId
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

const parseMatches = async matches => {
  if (!matches || matches === '') return {}
  const data = { claims: {} }
  const urls = _.uniq(matches.split('|'))
  for (const url of urls) {
    const { host, pathname } = new URL(url)
    if (getPropertyAndIdPerHost[host]) {
      const { property, value } = await getPropertyAndIdPerHost[host](pathname)
      if (value) {
        if (property === 'uri') data.uri = value
        else data.claims[property] = value
      }
    }
  }
  return data
}

const getPropertyAndIdPerHost = {
  'fr.dbpedia.org': async pathname => {
    const title = pathname.split('/')[2]
    const id = await getEntityIdBySitelink({ site: 'frwiki', title })
    if (id) return { property: 'uri', value: `wd:${id}` }
  },
  'viaf.org': pathname => ({ property: 'wdt:P214', value: pathname.split('/')[3] }),
  'wikidata.org': pathname => ({ property: 'uri', value: `wd:${pathname.split('/')[2]}` }),
  'www.idref.fr': pathname => ({ property: 'wdt:P269', value: pathname.split('/')[1] }),
}

const regroupRows = rows => {
  const editions = {}
  const works = {}
  const authors = {}
  const publishers = {}

  for (const row of rows) {
    addByBnfId(editions, row, 'edition')
    addByBnfId(works, row, 'work')
    addByBnfId(authors, row, 'author')
    addByBnfId(publishers, row, 'publisher')
  }

  if (Object.keys(editions).length !== 1) return
  const edition = Object.values(editions)[0]

  return {
    edition,
    works: Object.values(works),
    authors: Object.values(authors),
    publishers: Object.values(publishers),
  }
}

const addByBnfId = (index, row, typeName) => {
  if (!row[typeName]) return
  const bnfId = row[typeName].claims?.['wdt:P268'] || row[typeName].tempBnfId || row[typeName].labels?.fr
  index[bnfId] = row[typeName]
}

const addPublisherUri = async entry => {
  if (!entry) return
  const { publishers } = entry
  if (Object.keys(publishers).length !== 1) return
  const publisher = Object.values(publishers)[0]
  const { isbn } = entry.edition
  const publisherUri = await resolvePublisher(isbn, Object.values(publisher.labels)[0])
  if (publisherUri) entry.edition.claims['wdt:P123'] = publisherUri
}

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

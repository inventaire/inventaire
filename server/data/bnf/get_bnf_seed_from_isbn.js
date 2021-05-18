const _ = require('builders/utils')
const qs = require('querystring')
const parseIsbn = require('lib/isbn/parse')
const requests_ = require('lib/requests')
const { sparqlResults: simplifySparqlResults } = require('wikidata-sdk').simplify
const cache_ = require('lib/cache')
const { hashCode } = require('lib/utils/base')
const getEntityIdBySitelink = require('data/wikidata/get_entity_id_by_sitelink')
const { resolvePublisher } = require('controllers/entities/lib/resolver/resolve_publisher')

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
  const query = `SELECT DISTINCT ?edition ?editionTitle ?editionPublicationDate ?work ?workLabel ?workPublicationDate ?author ?authorLabel ?publisherLabel (GROUP_CONCAT(?workMatch;separator="|") AS ?workMatches) (GROUP_CONCAT(?authorMatch;separator="|") AS ?authorMatches) WHERE {

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

const formatRow = async (isbn, result, rawResult) => {
  const workLabelLang = rawResult.workLabel?.['xml:lang']
  if (workLabelLang) result.work.labelLang = workLabelLang
  const { edition, work, author, publisherLabel } = result
  const entry = {}
  entry.edition = { isbn, sameAs: [ edition.value ] }
  if (edition) {
    const { claims } = await parseMatches(edition.matches)
    entry.edition.claims = {
      'wdt:P268': getBnfId(edition.value),
      'wdt:P1476': edition.title,
      ...claims
    }
  }
  if (work) {
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
  if (author) {
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

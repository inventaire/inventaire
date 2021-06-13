const getEntityType = require('controllers/entities/lib/get_entity_type')
const { prefixifyWd } = require('controllers/entities/lib/prefix')
const parseIsbn = require('lib/isbn/parse')
const makeSparqlRequest = require('./make_sparql_request')
const { isItemId } = require('wikidata-sdk')

module.exports = async isbn => {
  const sparql = getQuery(isbn)
  const rows = await makeSparqlRequest(sparql)
  return buildEntryFromFormattedRows(rows)
}

const getQuery = isbn => {
  const isbnData = parseIsbn(isbn)
  if (!isbnData) throw new Error(`invalid isbn: ${isbn}`)
  const { isbn13h, isbn13, isbn10h, isbn10, groupLang } = isbnData
  return `SELECT DISTINCT ?item ?itemLabel ?title ?type ?work ?workLabel WHERE {
    { ?item wdt:P212 "${isbn13h}" . }
    UNION { ?item wdt:P212 "${isbn13}" . }
    UNION { ?item wdt:P957 "${isbn10h}" . }
    UNION { ?item wdt:P957 "${isbn10}" . }
    ?item wdt:P31 ?type .
    OPTIONAL { ?item wdt:P1476 ?title . }
    OPTIONAL {
      ?item wdt:P629 ?work .
    }
    SERVICE wikibase:label {
      bd:serviceParam wikibase:language "${groupLang},en" .
    }
  }`
}

const buildEntryFromFormattedRows = rows => {
  // TODO: deal with more complex cases
  if (rows.length !== 1) return
  const row = rows[0]
  const { item, type, title, work } = row
  const itemUri = prefixifyWd(item.value)
  const itemTypeUri = prefixifyWd(type)
  const itemType = getEntityType([ itemTypeUri ])

  // "SERVICE wikibase:label" defaults to the item id
  // when it doesn't find the desired label
  if (isItemId(item.label)) delete item.label
  if (work && isItemId(work.label)) delete work.label

  // A title is required to be set on the edition
  if (!(item.label || title)) return
  let entry
  if (itemType === 'edition' && work) {
    entry = {
      edition: {
        // Resolving the edtion to a Wikidata entity won't be possible
        // use until they are removed from quarantine
        // See https://github.com/inventaire/inventaire/issues/182
        uri: itemUri,
        claims: {
          'wdt:P1476': title || item.label || work.label
        }
      },
      works: [ { uri: prefixifyWd(work.value) } ]
    }
  } else if (itemType === 'work') {
    entry = {
      edition: {
        claims: {
          // On a work item, prefer the item label to the title
          // as it might be a better fit to the edition language
          'wdt:P1476': item.label || title
        }
      },
      works: [ { uri: itemUri } ]
    }
  }
  if (entry) {
    entry.edition = {
      claims: {
        'wdt:P1476': title || item.label
      }
    }
  }
  return entry
}

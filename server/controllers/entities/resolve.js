const { oneHour } = require('lib/time')
const { resolveUpdateAndCreate } = require('./lib/resolver/resolve_update_and_create')
const { getResolvedEntry } = require('data/dataseed/get_resolved_entry')

// Entry example:
// {
//   edition: {
//     claims: {
//       'wdt:P212': '978-3-7795-0208-1',
//       'wdt:P1680': 'Fragmente einer anarchistischen Anthropologie',
//       'wdt:P648': 'OL26350019M'
//     }
//   },
//   works: [
//     {
//       labels: { en: 'Frei von Herrschaft' },
//       claims: { 'wdt:P50': [ 'wd:Q1174579' ] }
//     }
//   ],
//   authors: [
//     {
//       labels: { en: 'David Graeber' }
//     }
//   ]
// }

const sanitization = {
  entries: {
    generic: 'collection'
  },
  create: {
    generic: 'boolean',
    optional: true
  },
  update: {
    generic: 'boolean',
    optional: true
  },
  enrich: {
    generic: 'boolean',
    optional: true
  },
  strict: {
    generic: 'boolean',
    optional: true,
    default: true
  },
  createFromSeed: {
    generic: 'boolean',
    optional: true,
    default: false
  }
}

const controller = async (params, req) => {
  let res
  req.setTimeout(oneHour)
  if (params.createFromSeed) {
    const [ entry ] = params.entries
    if (!entry) return
    res = await getResolvedEntry(entry.edition.isbn)
  } else {
    res = await resolveUpdateAndCreate(params)
  }
  const { resolvedEntries, errors } = res
  const data = { entries: resolvedEntries }
  if (!params.strict) data.errors = errors.map(formatError)
  return data
}

const formatError = err => {
  const { message, entry, context } = err
  if (context === entry) return { message, entry }
  else return { message, context, entry }
}

module.exports = { sanitization, controller }

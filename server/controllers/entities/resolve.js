const error_ = require('lib/error/error')
const responses_ = require('lib/responses')
const { sanitize } = require('lib/sanitize/sanitize')
const { oneHour } = require('lib/time')
const { resolveUpdateAndCreate } = require('./lib/resolver/resolve_update_and_create')

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
  }
}

module.exports = (req, res) => {
  req.setTimeout(oneHour)

  sanitize(req, res, sanitization)
  .then(params => {
    return resolveUpdateAndCreate(params)
    .then(({ resolvedEntries, errors }) => {
      const data = { entries: resolvedEntries }
      if (!params.strict) data.errors = errors.map(formatError)
      responses_.send(res, data)
    })
  })
  .catch(error_.Handler(req, res))
}

const formatError = err => {
  const { message, entry, context } = err
  if (context === entry) return { message, entry }
  else return { message, context, entry }
}

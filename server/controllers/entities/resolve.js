const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const sanitize = __.require('lib', 'sanitize/sanitize')
const sanitizeEntry = require('./lib/resolver/sanitize_entry')
const resolve = require('./lib/resolver/resolve')
const UpdateResolvedEntry = require('./lib/resolver/update_resolved_entry')
const CreateUnresolvedEntry = require('./lib/resolver/create_unresolved_entry')
const { oneHour } = __.require('lib', 'times')

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
    params.batchId = Date.now()
    const { strict } = params
    const { entries, errors } = sanitizeEntries(params.entries, strict)

    return sequentialResolve(entries, params, errors)
    .then(resolvedEntries => {
      const data = { entries: resolvedEntries }
      if (!strict) data.errors = errors.map(formatError)
      responses_.send(res, data)
    })
  })
  .catch(error_.Handler(req, res))
}

const sanitizeEntries = (entries, strict) => {
  const errors = []
  const sanitizedEntries = []
  entries.forEach(sanitizeEntryAndDispatch(sanitizedEntries, errors, strict))
  return { entries: sanitizedEntries, errors }
}

const sanitizeEntryAndDispatch = (sanitizedEntries, errors, strict) => entry => {
  try {
    sanitizedEntries.push(sanitizeEntry(entry))
  } catch (err) {
    handleError(strict, errors, err, entry)
  }
}

const sequentialResolve = (entries, params, errors) => {
  if (entries.length === 0) return Promise.resolve([])

  const { create, update, strict } = params
  const updateResolvedEntry = buildActionFn(update, UpdateResolvedEntry, params)
  const createUnresolvedEntry = buildActionFn(create, CreateUnresolvedEntry, params)
  const addResolvedEntry = entry => resolvedEntries.push(entry)
  const resolvedEntries = []

  const resolveNext = () => {
    const nextEntry = entries.shift()
    if (nextEntry == null) return resolvedEntries

    _.log(nextEntry, 'next entry')

    return resolve(nextEntry)
    .then(updateResolvedEntry)
    .then(createUnresolvedEntry)
    .then(addResolvedEntry)
    .catch(err => handleError(strict, errors, err, nextEntry))
    .then(resolveNext)
  }

  return resolveNext()
}

const buildActionFn = (flag, ActionFn, params) => {
  const { reqUserId, batchId } = params
  if (flag) {
    return ActionFn(reqUserId, batchId)
  } else {
    return _.identity
  }
}

const handleError = (strict, errors, err, entry) => {
  if (strict) {
    throw err
  } else {
    err.entry = entry
    errors.push(err)
  }
}

const formatError = err => {
  const { message, entry, context } = err
  if (context === entry) return { message, entry }
  else return { message, context, entry }
}

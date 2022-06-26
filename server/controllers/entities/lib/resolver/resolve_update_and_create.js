const _ = require('builders/utils')
const resolve = require('./resolve')
const UpdateResolvedEntry = require('./update_resolved_entry')
const CreateUnresolvedEntry = require('./create_unresolved_entry')
const sanitizeEntry = require('./sanitize_entry')
const { waitForCPUsLoadToBeBelow } = require('lib/os')
const { nice } = require('config')

const resolveUpdateAndCreate = async params => {
  params.batchId = Date.now()
  const { create, update, strict } = params
  const { entries, errors } = sanitizeEntries(params.entries, strict)

  const resolvedEntries = []
  if (entries.length === 0) return { resolvedEntries, errors }

  const updateResolvedEntry = buildActionFn(update, UpdateResolvedEntry, params)
  const createUnresolvedEntry = buildActionFn(create, CreateUnresolvedEntry, params)
  const addResolvedEntry = entry => resolvedEntries.push(entry)

  const resolveNext = async () => {
    if (nice) await waitForCPUsLoadToBeBelow({ threshold: 1 })
    const nextEntry = entries.shift()
    if (nextEntry == null) return { resolvedEntries, errors }

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
  if (flag) return ActionFn(params)
  else return _.identity
}

const handleError = (strict, errors, err, entry) => {
  err.context = err.context || {}
  err.context.entry = entry
  if (strict) {
    throw err
  } else {
    err.entry = entry
    errors.push(err)
  }
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

module.exports = { resolveUpdateAndCreate, sanitizeEntries }

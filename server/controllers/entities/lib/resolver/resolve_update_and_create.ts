import { identity } from 'lodash-es'
import type { ContextualizedError } from '#lib/error/format_error'
import { waitForCPUsLoadToBeBelow } from '#lib/os'
import { log } from '#lib/utils/logs'
import config from '#server/config'
import type { ResolverEntry } from '#types/resolver'
import CreateUnresolvedEntry from './create_unresolved_entry.js'
import { resolveEntry } from './resolve.js'
import sanitizeEntry from './sanitize_entry.js'
import UpdateResolvedEntry from './update_resolved_entry.js'

const { nice } = config

export async function resolveUpdateAndCreate (params) {
  params.batchId = Date.now()
  const { create, update, strict } = params
  const { entries, errors } = sanitizeEntries(params.entries, strict)

  const resolvedEntries = []
  if (entries.length === 0) return { resolvedEntries, errors }

  const updateResolvedEntry = buildActionFn(update, UpdateResolvedEntry, params)
  const createUnresolvedEntry = buildActionFn(create, CreateUnresolvedEntry, params)
  const addResolvedEntry = entry => resolvedEntries.push(entry)

  async function resolveNext () {
    if (nice) await waitForCPUsLoadToBeBelow({ threshold: 1 })
    const nextEntry = entries.shift()
    if (nextEntry == null) return { resolvedEntries, errors }

    log(nextEntry, 'next entry')

    return resolveEntry(nextEntry)
    .then(updateResolvedEntry)
    .then(createUnresolvedEntry)
    .then(addResolvedEntry)
    .catch(err => handleError(strict, errors, err, nextEntry))
    .then(resolveNext)
  }

  return resolveNext()
}

function buildActionFn (flag, ActionFn, params) {
  if (flag) return ActionFn(params)
  else return identity
}

type EntryError = ContextualizedError & { entry: ResolverEntry }

function handleError (strict: boolean, errors: EntryError[], err: EntryError, entry) {
  err.context = err.context || {}
  err.context.entry = entry
  if (strict) {
    throw err
  } else {
    err.entry = entry
    errors.push(err)
  }
}

export function sanitizeEntries (entries, strict) {
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

import { createUnresolvedEntry } from '#controllers/entities/lib/resolver/create_unresolved_entry'
import { updateResolvedEntry } from '#controllers/entities/lib/resolver/update_resolved_entry'
import type { ResolverParams } from '#controllers/entities/resolve'
import type { ContextualizedError } from '#lib/error/format_error'
import { waitForCPUsLoadToBeBelow } from '#lib/os'
import { log } from '#lib/utils/logs'
import config from '#server/config'
import type { BatchId } from '#server/types/patch'
import type { ResolverEntry, SanitizedResolverEntry } from '#types/resolver'
import { resolveEntry } from './resolve.js'
import { sanitizeEntry } from './sanitize_entry.js'

const { nice } = config

export interface ResolverBatchParams extends ResolverParams {
  batchId?: BatchId
}

export async function resolveUpdateAndCreate (params: ResolverBatchParams) {
  params.batchId = Date.now() as BatchId
  const { create, update, strict } = params
  const { entries, errors } = sanitizeEntries(params.entries, strict)

  const resolvedEntries: SanitizedResolverEntry[] = []
  if (entries.length === 0) return { resolvedEntries, errors }

  async function resolveNext () {
    if (nice) await waitForCPUsLoadToBeBelow({ threshold: 1 })
    const nextEntry = entries.shift()
    if (nextEntry == null) return { resolvedEntries, errors }

    log(nextEntry, 'next entry')
    try {
      await resolveEntry(nextEntry)
      if (update) await updateResolvedEntry(nextEntry, params)
      if (create) await createUnresolvedEntry(nextEntry, params)
      resolvedEntries.push(nextEntry)
    } catch (err) {
      handleError(strict, errors, err, nextEntry)
    }
    return resolveNext()
  }

  return resolveNext()
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

export function sanitizeEntries (entries: ResolverEntry[], strict: boolean) {
  const errors: EntryError[] = []
  const sanitizedEntries: SanitizedResolverEntry[] = []
  entries.forEach(sanitizeEntryAndDispatch(sanitizedEntries, errors, strict))
  return { entries: sanitizedEntries, errors }
}

const sanitizeEntryAndDispatch = (sanitizedEntries: SanitizedResolverEntry[], errors: EntryError[], strict: boolean) => (entry: ResolverEntry) => {
  try {
    sanitizedEntries.push(sanitizeEntry(entry))
  } catch (err) {
    handleError(strict, errors, err, entry)
  }
}

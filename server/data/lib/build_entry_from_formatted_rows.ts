import type { EditionLooseSeed, EntityLooseSeed, ExternalDatabaseEntryRow } from '#types/resolver'

export function buildEntryFromFormattedRows (formattedRows: ExternalDatabaseEntryRow[], getSourceId) {
  if (formattedRows.length === 0) return

  const editions: Record<string, EditionLooseSeed> = {}
  const works: Record<string, EntityLooseSeed> = {}
  const authors: Record<string, EntityLooseSeed> = {}
  const publishers: Record<string, EntityLooseSeed> = {}

  for (const row of formattedRows) {
    addByExternalId(getSourceId, editions, row, 'edition')
    addByExternalId(getSourceId, works, row, 'work')
    addByExternalId(getSourceId, authors, row, 'author')
    addByExternalId(getSourceId, publishers, row, 'publisher')
  }

  if (Object.values(editions).length === 0) return

  // If there are multiple editions matching a single ISBN,
  // assume that it's a duplicate in the source database
  // Example: 0-85772-166-6 matches both http://bnb.data.bl.uk/id/resource/019291758 and http://bnb.data.bl.uk/id/resource/018221968
  const edition = Object.values(editions)[0]

  return {
    edition,
    works: Object.values(works),
    authors: Object.values(authors),
    publishers: Object.values(publishers),
  }
}

function addByExternalId (
  getSourceId: (EntityLooseSeed) => string,
  index: Record<string, EntityLooseSeed | EditionLooseSeed>,
  row: ExternalDatabaseEntryRow,
  entityTypeName: 'edition' | 'work' | 'author' | 'publisher'
) {
  const draftEntity = row[entityTypeName]
  if (!draftEntity) return
  const sourceId = getSourceId(draftEntity)
  index[sourceId] = draftEntity
}

export const buildEntryFromFormattedRows = (formattedRows, getSourceId) => {
  if (formattedRows.length === 0) return

  const editions = {}
  const works = {}
  const authors = {}
  const publishers = {}

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

const addByExternalId = (getSourceId, index, row, entityTypeName) => {
  const draftEntity = row[entityTypeName]
  if (!draftEntity) return
  const bnfId = getSourceId(draftEntity)
  index[bnfId] = draftEntity
}

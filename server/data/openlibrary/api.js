const coverBase = 'http://covers.openlibrary.org'

export const coverByOlId = (olId, type = 'b') => `${coverBase}/${type}/olid/${olId}.jpg`

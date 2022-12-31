const coverBase = 'http://covers.openlibrary.org'

export default {
  coverByOlId: (olId, type = 'b') => `${coverBase}/${type}/olid/${olId}.jpg`
}

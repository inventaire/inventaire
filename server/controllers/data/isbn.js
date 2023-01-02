// An endpoint to get basic facts from an ISBN
// Returns a merge of isbn3 and dataseed data
import { getByIsbns as getSeedsByIsbns } from '#data/dataseed/dataseed'
import { parseIsbn } from '#lib/isbn/parse'

const sanitization = {
  isbn: {},
  refresh: { optional: true }
}

const controller = async ({ isbn, refresh }) => {
  const data = parseIsbn(isbn)

  // Not using source to pass the original input as 'source'
  // has another meaning in entities search
  delete data.source
  data.query = isbn

  const resp = await getSeedsByIsbns(data.isbn13, refresh)
  const seed = resp[0] || {}
  delete seed.isbn
  // TODO: convert image URL to hash?
  delete seed.image
  Object.assign(data, seed)
  return data
}

export default { sanitization, controller }

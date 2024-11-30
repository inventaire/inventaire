// An endpoint to get basic facts from an ISBN
// Returns a merge of isbn3 and dataseed data
import { omit } from 'lodash-es'
import { getSeedsByIsbns } from '#data/dataseed/dataseed'
import { parseIsbn } from '#lib/isbn/parse'
import type { IsbnData } from '#types/common'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'

const sanitization = {
  isbn: {},
  refresh: { optional: true },
}

async function controller ({ isbn, refresh }: SanitizedParameters) {
  const data: IsbnData & { query?: string } = parseIsbn(isbn)

  // Not using source to pass the original input as 'source'
  // has another meaning in entities search
  delete data.source
  data.query = isbn

  const resp = await getSeedsByIsbns(data.isbn13, refresh)
  const seed = resp[0] || {}
  return {
    ...data,
    ...omit(seed, [ 'isbn', 'image' ]),
  }
}

export default { sanitization, controller }

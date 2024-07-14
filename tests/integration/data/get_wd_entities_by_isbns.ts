import 'should'
import { keyBy } from 'lodash-es'
import { getWdEntitiesByIsbns } from '#data/wikidata/get_wd_entities_by_isbns'
import { toIsbn13 } from '#lib/isbn/isbn'
import { parseIsbn } from '#lib/isbn/parse'
import type { IsbnEntityUri, SerializedWdEntity } from '#server/types/entity'

describe('get_wd_entities_by_isbns', () => {
  it('should get an existing wd entity by isbn', async () => {
    const normalizedIsbnA = '9780375759239'
    const isbnUriA: IsbnEntityUri = `isbn:${normalizedIsbnA}`
    const isbnDataA = { ...parseIsbn(normalizedIsbnA), uri: isbnUriA }
    const normalizedIsbnB = '0671669893'
    const isbnUriB: IsbnEntityUri = `isbn:${toIsbn13(normalizedIsbnB)}`
    const isbnDataB = { ...parseIsbn(normalizedIsbnB), uri: isbnUriB }
    const res = await getWdEntitiesByIsbns([ isbnDataA, isbnDataB ], { refresh: true })
    const entities = keyBy(res.entities, 'uri') as Record<IsbnEntityUri, SerializedWdEntity>
    entities[isbnUriA].claims['invp:P1'].should.deepEqual([ 'wd:Q116194196' ])
    entities[isbnUriB].claims['invp:P1'].should.deepEqual([ 'wd:Q66425315' ])
  })

  it('should support composite editions', async () => {
    const isbn10 = '80-86096-16-5'
    const isbnUri: IsbnEntityUri = `isbn:${toIsbn13(isbn10)}`
    const isbnData = { ...parseIsbn(isbn10), uri: isbnUri }
    const res = await getWdEntitiesByIsbns([ isbnData ], { refresh: true })
    const entities = keyBy(res.entities, 'uri') as Record<IsbnEntityUri, SerializedWdEntity>
    entities[isbnUri].claims['invp:P1'].should.deepEqual([ 'wd:Q12056079' ])
  })
})

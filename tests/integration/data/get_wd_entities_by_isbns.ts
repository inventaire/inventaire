import 'should'
import { getWdEntitiesByIsbns } from '#data/wikidata/get_wd_entities_by_isbns'
import { parseIsbn } from '#lib/isbn/parse'
import type { IsbnEntityUri } from '#server/types/entity'

describe('get_wd_entities_by_isbns', () => {
  it.only('should get an existing wd entity by isbn', async () => {
    const wdUri = 'wd:Q116194196'
    const normalizedIsbnA = '9780375759239'
    const isbnUriA: IsbnEntityUri = `isbn:${normalizedIsbnA}`
    const isbnDataA = { ...parseIsbn(normalizedIsbnA), uri: isbnUriA }
    const normalizedIsbnB = '0671669893'
    const isbnUriB: IsbnEntityUri = `isbn:${normalizedIsbnB}`
    const isbnDataB = { ...parseIsbn(normalizedIsbnB), uri: isbnUriB }
    const res = await getWdEntitiesByIsbns([ isbnDataA, isbnDataB ], { refresh: true })
  })

  it('should support composite editions', async () => {
    const wdUri = 'wd:Q116194196'
    const normalizedIsbnA = '8086096165'
    const isbnUriA: IsbnEntityUri = `isbn:${normalizedIsbnA}`
    const isbnDataA = { ...parseIsbn(normalizedIsbnA), uri: isbnUriA }
    const normalizedIsbnB = '2850368261'
    const isbnUriB: IsbnEntityUri = `isbn:${normalizedIsbnB}`
    const isbnDataB = { ...parseIsbn(normalizedIsbnB), uri: isbnUriB }
    const res = await getWdEntitiesByIsbns([ isbnDataA, isbnDataB ], { refresh: true })
  })
})

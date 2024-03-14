import type { QueryDslQueryContainer, SearchRequest } from '@elastic/elasticsearch/lib/api/types.js'

export default ({ search, limit: size, minScore }) => {
  const should: QueryDslQueryContainer[] = [
    // Username
    { match: { username: { query: search, boost: 5 } } },
    { match_phrase_prefix: { username: { query: search, boost: 4 } } },
    { fuzzy: { username: search } },
    // Bio
    { match: { bio: search } },
    // Group or listing name
    { match: { name: { query: search, boost: 5 } } },
    { match_phrase_prefix: { name: { query: search, boost: 4 } } },
    { fuzzy: { name: search } },
    // Group or listing description
    { match: { description: search } },
  ]

  const searchRequest: SearchRequest = {
    query: {
      bool: { should },
    },
    size,
    min_score: minScore,
  }
  return searchRequest
}

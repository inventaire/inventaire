module.exports = ({ search, limit: size, minScore }) => {
  const should = [
    // Username
    { match: { username: { query: search, boost: 5 } } },
    { match_phrase_prefix: { username: { query: search, boost: 4 } } },
    { fuzzy: { username: search } },
    // Bio
    { match: { bio: search } },
    // Group name
    { match: { name: { query: search, boost: 5 } } },
    { match_phrase_prefix: { name: { query: search, boost: 4 } } },
    { fuzzy: { name: search } },
    // Group description
    { match: { description: search } }
  ]

  return {
    query: {
      bool: { should }
    },
    size,
    min_score: minScore
  }
}

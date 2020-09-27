module.exports = types => res => {
  if (!(res.hits && res.hits.hits)) return []
  return res.hits.hits
}

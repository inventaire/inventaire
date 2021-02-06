module.exports = {
  dropSpecialQueryCharacters: str => str.replace(specialQueryCharacters, ''),
  matchType: types => {
    return types.map(type => (
      { match: { type } }
    ))
  }
}

const specialQueryCharacters = /[!*~+/\\]/g

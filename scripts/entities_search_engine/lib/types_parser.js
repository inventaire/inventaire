const fs = require('fs')
let types = process.argv.slice(2)

module.exports = (folder, extension) => {
  const re = new RegExp(`.${extension}$`)
  const availableTypes = fs.readdirSync(folder)
    // filter-out archives names on the pattern genres.2016-06-10T08-26.json
    .filter(filename => filename.split('.').length === 2)
    .map(filename => filename.replace(re, ''))

  if (types.length === 0) {
    throw new Error('missing type argument')
  }

  if (types[0] === 'all') {
    types = availableTypes
  } else {
    types.forEach(type => {
      if (!availableTypes.includes(type)) {
        throw new Error(`missing ${extension} file for type ${type}`)
      }
    })
  }

  return types
}

const { readFile, writeFile } = require('fs').promises
const stringify = data => JSON.stringify(data, null, 4)
const assert_ = require('./assert_types')

module.exports = {
  readJsonFile: path => {
    assert_.string(path)
    return readFile(path, 'utf-8')
    .then(JSON.parse)
  },

  writeJsonFile: (path, data) => {
    assert_.string(path)
    assert_.type('object|array', data)
    const json = stringify(data)
    return writeFile(path, json)
  }
}

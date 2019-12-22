const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('graceful-fs'))
const parse = JSON.parse.bind(JSON)
const stringify = data => JSON.stringify(data, null, 4)
const assert_ = require('./assert_types')

module.exports = {
  jsonReadAsync: path => {
    assert_.string(path)
    return fs.readFileAsync(path, 'utf-8')
    .then(parse)
  },

  jsonWrite: (path, data) => {
    assert_.string(path)
    assert_.object(data)
    const json = stringify(data)
    return fs.writeFileSync(path, json)
  }
}

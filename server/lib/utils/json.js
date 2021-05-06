// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

const { readFile, writeFile } = require('fs').promises
const stringify = data => JSON.stringify(data, null, 2)
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

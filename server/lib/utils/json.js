import { readFile, writeFile } from 'node:fs/promises'
import assert_ from './assert_types'

const stringify = data => JSON.stringify(data, null, 2)

export default {
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

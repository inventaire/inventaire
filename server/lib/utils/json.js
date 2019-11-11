/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('graceful-fs'));
const parse = JSON.parse.bind(JSON);
const stringify = data => JSON.stringify(data, null, 4);
const assert_ = require('./assert_types');

module.exports = {
  jsonReadAsync(path){
    assert_.string(path);
    return fs.readFileAsync(path, 'utf-8')
    .then(parse);
  },

  jsonWrite(path, data){
    assert_.types([ 'string', 'object' ], [ path, data ]);
    const json = stringify(data);
    return fs.writeFileSync(path, json);
  }
};

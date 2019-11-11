const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');

module.exports = function(search, size){
  const should = [
    { match_phrase_prefix: { _all: { query: search, boost: 5 } } },
    { match: { _all: { query: search, boost: 5 } } },
    { prefix: { _all: _.last(search.split(' ')) } }
  ];

  return { query: { bool: { should } }, size, min_score: 0.5 };
};

/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const { Promise } = __.require('lib', 'promises');
const should = require('should');

const search = __.require('controllers', 'search/lib/get_wd_authors');

const authorsWithLongerName = {
  search() { return search('Zach Weinersmith', 'humans'); },
  lessGoodId: 'Q3574507' // => Zach Weiner
};

describe('elastic query of an author name within indexes of wikidata humans', () => it('only full phrase match should appear in result', function(done){
  const authorInWdDescriptions = {
    query: 'Karl Marx',
    goodId: 'Q9061', // => label: 'Karl Marx'
    lessGoodId: 'Q214986' // => label: 'Heinrich Marx'
  };

  search(authorInWdDescriptions.query, 'humans')
  .then(function(results){
    const goodResult = _.find(results, { _id: authorInWdDescriptions.goodId });
    const badResult = _.find(results, { _id: authorInWdDescriptions.lessGoodId });

    const ids = _.map(results, '_id');
    ids.includes(authorInWdDescriptions.goodId).should.be.true();
    ids.includes(authorInWdDescriptions.lessGoodId).should.be.false();

    return done();
  });

}));

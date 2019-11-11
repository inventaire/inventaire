/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const should = require('should');
const { nonAuthReq } = require('../utils/utils');

describe('wikipedia:extract', () => it('should get an extract of a Wikipedia article', function(done){
  nonAuthReq('get', '/api/data?action=wp-extract&lang=fr&title=Gilbert_Simondon')
  .then(function(res){
    res.url.should.equal('https://fr.wikipedia.org/wiki/Gilbert_Simondon');
    res.extract.should.startWith('Gilbert Simondon');
    return done();}).catch(done);

}));

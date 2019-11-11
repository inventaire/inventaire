/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
require('should');
const { matchTitle } = __.require('controllers', 'entities/lib/scaffold_entity_from_seed/work_entity_search_utils');

const result = {
  labels: {
    en: 'Lorem ipsum dolor sit amet'
  }
};

const volumeResult = {
  labels: {
    en: 'Lorem ipsum dolor sit amet Vol. 10'
  }
};

describe('work_entity_search_utils', () => describe('matchTitle', function() {
  it('should be true on exact match', function(done){
    const title = 'Lorem ipsum dolor sit amet';
    matchTitle(title, 'fr')(result).should.be.true();
    return done();
  });

  it('should be true on close match', function(done){
    const title = 'Lorem ipsum dolo sit amet';
    matchTitle(title, 'fr')(result).should.be.true();
    return done();
  });

  it('should be true on volume exact match', function(done){
    const title = 'Lorem ipsum dolor sit amet Vol. 10';
    matchTitle(title, 'fr')(volumeResult).should.be.true();
    return done();
  });

  return it('should be false on volume close match', function(done){
    const title = 'Lorem ipsum dolor sit amet Vol. 1';
    matchTitle(title, 'fr')(volumeResult).should.be.false();
    return done();
  });
}));

/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const should = require('should');
const { authReq, nonAuthReq, undesiredErr } = require('../utils/utils');
const { groupPromise, endpointAction } = require('../fixtures/groups');

describe('groups:get', function() {
  describe('default', () => it('should get all user groups', function(done){
    groupPromise
    .then(group => authReq('get', endpointAction)
    .then(function(res){
      res.groups.should.be.an.Array();
      const groupsIds = _.map(res.groups, '_id');
      should(groupsIds.includes(group._id)).be.true();
      return done();
    })).catch(undesiredErr(done));

  }));

  describe('by-id', () => it('should get a group by id', function(done){
    groupPromise
    .delay(500)
    .then(group => nonAuthReq('get', `${endpointAction}=by-id&id=${group._id}`)
    .then(function(res){
      res.group._id.should.equal(group._id);
      res.group.name.should.equal(group.name);
      res.group.slug.should.equal(group.slug);
      return done();
    })).catch(undesiredErr(done));

  }));

  return describe('by-slug', () => it('should get a group by slug', function(done){
    groupPromise
    .delay(500)
    .then(group => nonAuthReq('get', `${endpointAction}=by-slug&slug=${group.slug}`)
    .then(function(res){
      res.group._id.should.equal(group._id);
      res.group.name.should.equal(group.name);
      res.group.slug.should.equal(group.slug);
      return done();
    })).catch(undesiredErr(done));

  }));
});

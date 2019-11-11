/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const should = require('should');
const { authReq, undesiredErr } = require('../utils/utils');
const { groupName } = require('../fixtures/groups');
const slugify = __.require('controllers', 'groups/lib/slugify');

describe('groups:create', function() {
  it('should create a group', function(done){
    const name = groupName();
    authReq('post', '/api/groups?action=create', { name })
    .then(function(res){
      res.name.should.equal(name);
      res.slug.should.equal(slugify(name));
      res.searchable.should.be.true();
      res.creator.should.equal(res.admins[0].user);
      return done();}).catch(undesiredErr(done));

  });

  return it('should reject a group with an empty name or generated slug', function(done){
    const name = '??';
    authReq('post', '/api/groups?action=create', { name })
    .catch(function(err){
      err.statusCode.should.equal(400);
      err.body.error_name.should.equal('invalid_name');
      return done();}).catch(undesiredErr(done));

  });
});

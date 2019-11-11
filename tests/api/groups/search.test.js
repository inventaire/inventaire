/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS204: Change includes calls to have a more natural evaluation order
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const should = require('should');
const faker = require('faker');
const { authReq, nonAuthReq, undesiredErr } = require('../utils/utils');
const { groupName } = require('../fixtures/groups');
const slugify = __.require('controllers', 'groups/lib/slugify');

describe('groups:search', function() {
  it('should find a group by its name', function(done){
    const name = groupName();
    authReq('post', '/api/groups?action=create', { name })
    .delay(1000)
    .then(function(creationRes){
      const groupId = creationRes._id;
      return nonAuthReq('get', `/api/groups?action=search&search=${name}`)
      .then(function(searchRes){
        let needle;
        ((needle = groupId, groupsIds(searchRes).includes(needle))).should.be.true();
        return done();
      });}).catch(undesiredErr(done));

  });

  it('should find a group by its description', function(done){
    const name = groupName();
    const description = faker.lorem.paragraph();
    authReq('post', '/api/groups?action=create', { name, description })
    .delay(1000)
    .then(function(creationRes){
      const groupId = creationRes._id;
      return nonAuthReq('get', `/api/groups?action=search&search=${description}`)
      .then(function(searchRes){
        let needle;
        ((needle = groupId, groupsIds(searchRes).includes(needle))).should.be.true();
        return done();
      });}).catch(undesiredErr(done));

  });

  return it('should not find a group when not searchable', function(done){
    const name = groupName();
    authReq('post', '/api/groups?action=create', { name, searchable: false })
    .delay(1000)
    .then(function(creationRes){
      const groupId = creationRes._id;
      return nonAuthReq('get', `/api/groups?action=search&search=${name}`)
      .then(function(searchRes){
        let needle;
        ((needle = groupId, groupsIds(searchRes).includes(needle))).should.not.be.true();
        return done();
      });}).catch(undesiredErr(done));

  });
});

var groupsIds = res => _.map(res.groups, '_id');

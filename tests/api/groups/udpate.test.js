/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const should = require('should');
const { nonAuthReq, authReq, undesiredErr } = require('../utils/utils');
const { groupPromise, endpointAction } = require('../fixtures/groups');
const slugify = __.require('controllers', 'groups/lib/slugify');

describe('groups:update-settings', function() {
  it('should update the group slug when updating the name', function(done){
    groupPromise
    .then(function(group){
      const groupId = group._id;
      const updatedName = group.name + '-updated';
      return authReq('put', `${endpointAction}=update-settings`, {
        group: groupId,
        attribute: 'name',
        value: updatedName
      }).delay(50)
      .then(function(updateRes){
        updateRes.ok.should.be.true();
        return nonAuthReq('get', `${endpointAction}=by-id&id=${groupId}`)
        .then(function(getRes){
          ({ group } = getRes);
          group.name.should.equal(updatedName);
          group.slug.should.equal(slugify(updatedName));
          return done();
        });
      });}).catch(undesiredErr(done));

  });

  it('should request a group slug update when updating the name', function(done){
    groupPromise
    .then(function(group){
      const groupId = group._id;
      const updatedName = group.name + '-updated-again';
      return authReq('put', `${endpointAction}=update-settings`, {
        group: groupId,
        attribute: 'name',
        value: updatedName
      }).delay(50)
      .then(function(updateRes){
        updateRes.ok.should.be.true();
        updateRes.update.slug.should.equal(slugify(updatedName));
        return done();
      });}).catch(undesiredErr(done));

  });

  return it('should update description', function(done){
    const updatedDescription = 'Lorem ipsum dolor sit amet';
    groupPromise
    .then(function(group){
      const groupId = group._id;
      return authReq('put', `${endpointAction}=update-settings`, {
        group: groupId,
        attribute: 'description',
        value: updatedDescription
      }).delay(50)
      .then(function(updateRes){
        updateRes.ok.should.be.true();
        Object.keys(updateRes.update).length.should.equal(0);
        return nonAuthReq('get', `${endpointAction}=by-id&id=${groupId}`)
        .then(function(getRes){
          ({ group } = getRes);
          group.description.should.equal(updatedDescription);
          return done();
        });
      });}).catch(undesiredErr(done));

  });
});

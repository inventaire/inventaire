/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');

const should = require('should');
const sinon = require('sinon');

let spies = {};

const resetSpies = () => ({
  acceptRequest: sinon.spy(),
  simultaneousRequest: sinon.spy(),
  makeRequest: sinon.spy(),
  removeRelation: sinon.spy(),
  forceFriendship: sinon.spy()
});

const actions = {
  acceptRequest() { return spies.acceptRequest(); },
  simultaneousRequest() { return spies.simultaneousRequest(); },
  makeRequest() { return spies.makeRequest(); },
  removeRelation() { return spies.removeRelation(); },
  forceFriendship() { return spies.forceFriendship(); }
};

const totalSpiesCount = function() {
  let count = 0;
  for (let key in spies) {
    const value = spies[key];
    count += value.callCount;
  }
  return count;
};

const solveIntent = __.require('controllers', 'relations/lib/solve_intent')(actions);

describe('relations', () => describe('solveIntent', function() {
  describe('requestFriend', function() {
    beforeEach(() => spies = resetSpies());
    it('env', function(done){
      solveIntent.should.be.an.Object();
      solveIntent.requestFriend.should.be.a.Function();
      spies.should.be.an.Object();
      spies.acceptRequest.should.be.a.Function();
      spies.acceptRequest.callCount.should.equal(0);
      actions.acceptRequest();
      spies.acceptRequest.callCount.should.equal(1);
      spies = resetSpies();
      spies.acceptRequest.callCount.should.equal(0);
      return done();
    });

    it("should makeRequest on status 'none'", function(done){
      spies.makeRequest.callCount.should.equal(0);
      solveIntent.requestFriend('a', 'b', 'none');
      spies.makeRequest.callCount.should.equal(1);
      totalSpiesCount().should.equal(1);
      return done();
    });

    it("should do nothing on status 'userRequested'", function(done){
      solveIntent.requestFriend('a', 'b', 'userRequested');
      totalSpiesCount().should.equal(0);
      return done();
    });

    it("should simultaneousRequest on status 'otherRequested'", function(done){
      solveIntent.requestFriend('a', 'b', 'otherRequested');
      spies.simultaneousRequest.callCount.should.equal(1);
      totalSpiesCount().should.equal(1);
      return done();
    });

    return it("should do nothing on status 'friends'", function(done){
      solveIntent.requestFriend('a', 'b', 'friends');
      totalSpiesCount().should.equal(0);
      return done();
    });
  });

  describe('cancelFriendRequest', function() {
    beforeEach(() => spies = resetSpies());
    it("should do nothing on status 'none'", function(done){
      solveIntent.cancelFriendRequest('a', 'b', 'none');
      totalSpiesCount().should.equal(0);
      return done();
    });

    it("should removeRelation on status 'userRequested'", function(done){
      solveIntent.cancelFriendRequest('a', 'b', 'userRequested');
      spies.removeRelation.callCount.should.equal(1);
      totalSpiesCount().should.equal(1);
      return done();
    });

    it("should do nothing on status 'otherRequested'", function(done){
      solveIntent.cancelFriendRequest('a', 'b', 'otherRequested');
      totalSpiesCount().should.equal(0);
      return done();
    });

    return it("should do nothing on status 'friends'", function(done){
      solveIntent.cancelFriendRequest('a', 'b', 'friends');
      totalSpiesCount().should.equal(0);
      return done();
    });
  });

  return describe('removeFriendship', function() {
    beforeEach(() => spies = resetSpies());
    it("should do nothing on status 'none'", function(done){
      solveIntent.removeFriendship('a', 'b', 'none');
      totalSpiesCount().should.equal(0);
      return done();
    });

    it("should removeRelation on status 'userRequested'", function(done){
      solveIntent.removeFriendship('a', 'b', 'userRequested');
      spies.removeRelation.callCount.should.equal(1);
      totalSpiesCount().should.equal(1);
      return done();
    });

    it("should removeRelation on status 'otherRequested'", function(done){
      solveIntent.removeFriendship('a', 'b', 'otherRequested');
      spies.removeRelation.callCount.should.equal(1);
      totalSpiesCount().should.equal(1);
      return done();
    });

    return it("should removeRelation on status 'friends'", function(done){
      solveIntent.removeFriendship('a', 'b', 'friends');
      spies.removeRelation.callCount.should.equal(1);
      totalSpiesCount().should.equal(1);
      return done();
    });
  });
}));

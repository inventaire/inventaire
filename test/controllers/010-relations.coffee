CONFIG = require('config')
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'

should = require 'should'
sinon = require 'sinon'

spies = {}

resetSpies = ->
  acceptRequest: sinon.spy()
  simultaneousRequest: sinon.spy()
  makeRequest: sinon.spy()
  removeRelation: sinon.spy()
  forceFriendship: sinon.spy()

actions =
  acceptRequest: -> spies.acceptRequest()
  simultaneousRequest: -> spies.simultaneousRequest()
  makeRequest: -> spies.makeRequest()
  removeRelation: -> spies.removeRelation()
  forceFriendship: -> spies.forceFriendship()

totalSpiesCount = ->
  count = 0
  count += v.callCount  for k,v of spies
  return count


solveIntent = __.require('controllers', 'relations/lib/solve_intent')(actions)

describe 'relations', ->
  describe 'solveIntent', ->
    describe 'requestFriend', ->
      beforeEach -> spies = resetSpies()
      it "env", (done)->
        solveIntent.should.be.an.Object()
        solveIntent.requestFriend.should.be.a.Function()
        spies.should.be.an.Object()
        spies.acceptRequest.should.be.a.Function()
        spies.acceptRequest.callCount.should.equal 0
        actions.acceptRequest()
        spies.acceptRequest.callCount.should.equal 1
        spies = resetSpies()
        spies.acceptRequest.callCount.should.equal 0
        done()

      it "should makeRequest on status 'none'", (done)->
        spies.makeRequest.callCount.should.equal 0
        solveIntent.requestFriend('a', 'b', 'none')
        spies.makeRequest.callCount.should.equal 1
        totalSpiesCount().should.equal 1
        done()

      it "should do nothing on status 'userRequested'", (done)->
        solveIntent.requestFriend('a', 'b', 'userRequested')
        totalSpiesCount().should.equal 0
        done()

      it "should simultaneousRequest on status 'otherRequested'", (done)->
        solveIntent.requestFriend('a', 'b', 'otherRequested')
        spies.simultaneousRequest.callCount.should.equal 1
        totalSpiesCount().should.equal 1
        done()

      it "should do nothing on status 'friends'", (done)->
        solveIntent.requestFriend('a', 'b', 'friends')
        totalSpiesCount().should.equal 0
        done()

    describe 'cancelFriendRequest', ->
      beforeEach -> spies = resetSpies()
      it "should do nothing on status 'none'", (done)->
        solveIntent.cancelFriendRequest('a', 'b', 'none')
        totalSpiesCount().should.equal 0
        done()

      it "should removeRelation on status 'userRequested'", (done)->
        solveIntent.cancelFriendRequest('a', 'b', 'userRequested')
        spies.removeRelation.callCount.should.equal 1
        totalSpiesCount().should.equal 1
        done()

      it "should do nothing on status 'otherRequested'", (done)->
        solveIntent.cancelFriendRequest('a', 'b', 'otherRequested')
        totalSpiesCount().should.equal 0
        done()

      it "should do nothing on status 'friends'", (done)->
        solveIntent.cancelFriendRequest('a', 'b', 'friends')
        totalSpiesCount().should.equal 0
        done()

    describe 'removeFriendship', ->
      beforeEach -> spies = resetSpies()
      it "should do nothing on status 'none'", (done)->
        solveIntent.removeFriendship('a', 'b', 'none')
        totalSpiesCount().should.equal 0
        done()

      it "should removeRelation on status 'userRequested'", (done)->
        solveIntent.removeFriendship('a', 'b', 'userRequested')
        spies.removeRelation.callCount.should.equal 1
        totalSpiesCount().should.equal 1
        done()

      it "should removeRelation on status 'otherRequested'", (done)->
        solveIntent.removeFriendship('a', 'b', 'otherRequested')
        spies.removeRelation.callCount.should.equal 1
        totalSpiesCount().should.equal 1
        done()

      it "should removeRelation on status 'friends'", (done)->
        solveIntent.removeFriendship('a', 'b', 'friends')
        spies.removeRelation.callCount.should.equal 1
        totalSpiesCount().should.equal 1
        done()

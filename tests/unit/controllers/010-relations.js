
require('should')
const sinon = require('sinon')

let spies = {}

const resetSpies = () => ({
  acceptRequest: sinon.spy(),
  simultaneousRequest: sinon.spy(),
  makeRequest: sinon.spy(),
  removeRelation: sinon.spy()
})

const actions = {
  acceptRequest: () => spies.acceptRequest(),
  simultaneousRequest: () => spies.simultaneousRequest(),
  makeRequest: () => spies.makeRequest(),
  removeRelation: () => spies.removeRelation()
}

const totalSpiesCount = () => {
  let count = 0
  for (const key in spies) {
    const value = spies[key]
    count += value.callCount
  }
  return count
}

const solveIntent = require('controllers/relations/lib/solve_intent')(actions)

describe('relations', () => {
  describe('solveIntent', () => {
    describe('requestFriend', () => {
      beforeEach(() => { spies = resetSpies() })

      it('env', () => {
        solveIntent.should.be.an.Object()
        solveIntent.requestFriend.should.be.a.Function()
        spies.should.be.an.Object()
        spies.acceptRequest.should.be.a.Function()
        spies.acceptRequest.callCount.should.equal(0)
        actions.acceptRequest()
        spies.acceptRequest.callCount.should.equal(1)
        spies = resetSpies()
        spies.acceptRequest.callCount.should.equal(0)
      })

      it("should makeRequest on status 'none'", () => {
        spies.makeRequest.callCount.should.equal(0)
        solveIntent.requestFriend('a', 'b', 'none')
        spies.makeRequest.callCount.should.equal(1)
        totalSpiesCount().should.equal(1)
      })

      it("should do nothing on status 'userRequested'", () => {
        solveIntent.requestFriend('a', 'b', 'userRequested')
        totalSpiesCount().should.equal(0)
      })

      it("should simultaneousRequest on status 'otherRequested'", () => {
        solveIntent.requestFriend('a', 'b', 'otherRequested')
        spies.simultaneousRequest.callCount.should.equal(1)
        totalSpiesCount().should.equal(1)
      })

      it("should do nothing on status 'friends'", () => {
        solveIntent.requestFriend('a', 'b', 'friends')
        totalSpiesCount().should.equal(0)
      })
    })

    describe('cancelFriendRequest', () => {
      beforeEach(() => { spies = resetSpies() })

      it("should do nothing on status 'none'", () => {
        solveIntent.cancelFriendRequest('a', 'b', 'none')
        totalSpiesCount().should.equal(0)
      })

      it("should removeRelation on status 'userRequested'", () => {
        solveIntent.cancelFriendRequest('a', 'b', 'userRequested')
        spies.removeRelation.callCount.should.equal(1)
        totalSpiesCount().should.equal(1)
      })

      it("should do nothing on status 'otherRequested'", () => {
        solveIntent.cancelFriendRequest('a', 'b', 'otherRequested')
        totalSpiesCount().should.equal(0)
      })

      it("should do nothing on status 'friends'", () => {
        solveIntent.cancelFriendRequest('a', 'b', 'friends')
        totalSpiesCount().should.equal(0)
      })
    })

    describe('removeFriendship', () => {
      beforeEach(() => { spies = resetSpies() })

      it("should do nothing on status 'none'", () => {
        solveIntent.removeFriendship('a', 'b', 'none')
        totalSpiesCount().should.equal(0)
      })

      it("should removeRelation on status 'userRequested'", () => {
        solveIntent.removeFriendship('a', 'b', 'userRequested')
        spies.removeRelation.callCount.should.equal(1)
        totalSpiesCount().should.equal(1)
      })

      it("should removeRelation on status 'otherRequested'", () => {
        solveIntent.removeFriendship('a', 'b', 'otherRequested')
        spies.removeRelation.callCount.should.equal(1)
        totalSpiesCount().should.equal(1)
      })

      it("should removeRelation on status 'friends'", () => {
        solveIntent.removeFriendship('a', 'b', 'friends')
        spies.removeRelation.callCount.should.equal(1)
        totalSpiesCount().should.equal(1)
      })
    })
  })
})

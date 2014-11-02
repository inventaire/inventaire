__ = require('config').root
_ = __.require 'builders', 'utils'

should = require 'should'
trycatch = require 'trycatch'

graph = __.require 'graph', 'social_graph'


relation = {s: 'john', p: 'requested', o: 'bobby'}

describe 'RELATIONS', ->
  describe 'relationStatus', ->
    it "should return none when no relation", (done)->
      trycatch( ->
        graph.relationStatus('bla', 'blu')
        .then (status)->
          status.should.be.a.String
          status.should.equal 'none'
          done()
        .catch (err)-> throw new Error(err)
      , done)

    it "should return right status after request", (done)->
      trycatch( ->
        graph.putUserFriendRequest('sarah', 'oconnor')
        .then ->
          graph.relationStatus('sarah', 'oconnor')
          .then (status)->
            status.should.equal 'userRequested'
            graph.relationStatus('oconnor', 'sarah')
            .then (status)->
              status.should.equal 'friendRequested'
              done()
        .catch (err)-> throw new Error(err)
      , done)

  describe 'putUserFriendRequest', ->
    it "should add the proper triple", (done)->
      trycatch( ->
        graph.get(relation)
        .then (list)->
          list.length.should.equal 0

          graph.putUserFriendRequest('john', 'bobby')
          .then ->
            graph.get(relation)
            .then (list)->
              list.length.should.equal 1
              done()
        .catch (err)-> throw new Error(err)
      , done)


  describe 'getUserFriendRequests', ->
    it "should only find requests from others", (done)->
      trycatch( ->

        graph.requestFriend('hubert', 'georges')
        .then ->

          graph.getUserFriendRequests('hubert')
          .then (list)->
            list.should.be.an.Array
            list.length.should.equal 0

            graph.getUserFriendRequests('georges')
            .then (list)->
              list.should.be.an.Array
              list.length.should.equal 1
              list[0].should.equal 'hubert'
              done()

        .catch (err)-> throw new Error(err)
      , done)
__ = require('config').root
_ = __.require 'builders', 'utils'

should = require 'should'
trycatch = require 'trycatch'

graph = __.require 'graph', 'social_graph'

Promise = require 'bluebird'


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
        graph.requestFriend('sarah', 'oconnor')
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

  describe 'requestFriend', ->
    it "should create a request if none existed", (done)->
      trycatch( ->
        graph.requestFriend('billy', 'eliott')
        .then ->
          p1 = graph.relationStatus('billy', 'eliott')
          p2 = graph.relationStatus('eliott', 'billy')
          Promise.all([p1, p2])
          .spread (fromBilly, fromEliott)->
            fromBilly.should.equal 'userRequested'
            fromEliott.should.equal 'friendRequested'
            done()
        .catch (err)-> throw new Error(err)
      , done)

  describe 'acceptRequest', ->
    it "should put a friend relation and delete the request", (done)->
      trycatch( ->
        graph.requestFriend('ness', 'scott')
        .then ->
          graph.acceptRequest('scott', 'ness')
          .then ->
            p1 = graph.relationStatus('ness', 'scott')
            p2 = graph.relationStatus('scott', 'ness')
            p3 = graph.getUserRelations('ness')
            p4 = graph.getUserRelations('scott')
            Promise.all([p1, p2, p3, p4])
            .spread (fromNess, fromScott, nessRel, scottRel)->

              fromNess.should.equal 'friend'
              fromScott.should.equal 'friend'

              nessRel.friends.length.should.equal 1
              nessRel.userRequests.length.should.equal 0
              nessRel.othersRequests.length.should.equal 0

              scottRel.friends.length.should.equal 1
              scottRel.userRequests.length.should.equal 0
              scottRel.othersRequests.length.should.equal 0

              done()
        .catch (err)-> throw new Error(err)
      , done)

  describe 'getOthersRequests', ->
    it "should only find requests from others", (done)->
      trycatch( ->

        graph.requestFriend('hubert', 'georges')
        .then ->

          graph.getOthersRequests('hubert')
          .then (list)->
            list.should.be.an.Array
            list.length.should.equal 0

            graph.getOthersRequests('georges')
            .then (list)->
              list.should.be.an.Array
              list.length.should.equal 1
              list[0].should.equal 'hubert'
              done()

        .catch (err)-> throw new Error(err)
      , done)

  describe 'getUserRequests', ->
    it "should only find requests from others", (done)->
      trycatch( ->

        graph.requestFriend('007', 'penny')
        .then ->

          graph.getUserRequests('penny')
          .then (list)->
            list.should.be.an.Array
            list.length.should.equal 0

            graph.getUserRequests('007')
            .then (list)->
              list.should.be.an.Array
              list.length.should.equal 1
              list[0].should.equal 'penny'
              done()

        .catch (err)-> throw new Error(err)
      , done)

  describe 'getUserRelations', ->
    it "should return a map of relations", (done)->
      trycatch( ->
        graph.getUserRelations('max')
        .then (relations)->
          relations.should.be.an.Object
          relations.friends.should.be.an.Array
          relations.userRequests.should.be.an.Array
          relations.othersRequests.should.be.an.Array
          relations.friends.length.should.equal 0
          relations.userRequests.length.should.equal 0
          relations.othersRequests.length.should.equal 0

          graph.requestFriend('max', 'jane')
          .then ->
            graph.getUserRelations('max')
            .then (relations)->
              relations.friends.length.should.equal 0
              relations.userRequests.length.should.equal 1
              relations.userRequests[0].should.equal 'jane'
              relations.othersRequests.length.should.equal 0
          done()
        .catch (err)-> throw new Error(err)
      , done)


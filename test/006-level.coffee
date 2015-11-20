__ = require('config').universalPath
_ = __.require 'builders', 'utils'

should = require 'should'
expect = require('chai').expect
trycatch = require 'trycatch'
Promise = require 'bluebird'

levelBase = __.require 'level', 'base'
subDb = levelBase.sub('test db')
promDb = levelBase.promisified(subDb)
unjsonizedDb = levelBase.unjsonized(promDb)
db = unjsonizedDb

describe 'DB', ->
  describe 'LEVEL BASE', ->

    describe 'SUB', ->
      it "should put and get a string", (done)->
        trycatch( ->
          subDb.put 'what', 'zup', (err, body)->
            if err? then _.error err
            subDb.get 'what', (err, body)->
              _.log body, 'body'
              body.should.equal 'zup'
              done()
        , done)

      it "should put and get an object", (done)->
        trycatch( ->
          obj = {bob: 'by'}
          json = JSON.stringify(obj)
          subDb.put 'salut', json, (err, body)->
            if err? then _.error err
            subDb.get 'salut', (err, body)->
              _.log body, 'body'
              body.should.be.a.String
              obj2 = JSON.parse body
              obj2.should.be.an.Object
              obj2.bob.should.equal 'by'
              done()
        , done)

    describe 'PROMISIFIED', ->
      it "should put and get a string", (done)->
        trycatch( ->
          promDb.putAsync('what', 'zup')
          .then (res)->
            promDb.getAsync('what')
            .then (res)->
              _.log res, 'res'
              res.should.equal 'zup'
              done()
        , done)

      it "should put and get an object", (done)->
        trycatch( ->
          obj = {da: 'zup'}
          json = JSON.stringify(obj)
          promDb.putAsync('yo', json)
          .then (res)->
            promDb.getAsync('yo')
            .then (res)->
              obj2 = JSON.parse res
              obj2.should.be.an.Object
              obj2.da.should.equal 'zup'
              done()
        , done)

    describe 'UNJSONIZED', ->
      it "should put and get a string", (done)->
        trycatch( ->
          unjsonizedDb.put('what', 'zup')
          .then (res)->
            unjsonizedDb.get('what')
            .then (res)->
              _.log res, 'res'
              res.should.equal 'zup'
              done()
        , done)

      it "should put and get an object", (done)->
        trycatch( ->
          obj = {ahoy: 'georges'}
          unjsonizedDb.put('ohoh', obj)
          .then (res)->
            unjsonizedDb.get('ohoh')
            .then (res)->
              res.should.be.an.Object
              res.ahoy.should.equal 'georges'
              done()
        , done)

    describe 'GET STREAM', ->
      it "should return a promise", (done)->
        trycatch( ->
          db.getStream()
          .then (res)->
            _.log res, 'res'
            done()
        , done)

      it "should return just what is asked", (done)->
        trycatch( ->
          db.put('123:a', 'zou')
          db.put('123:b', 'bi')
          db.put('123:c', 'dou')
          params =
            gt: '123'
            lt: '123' + 'Z'
          db.getStream(params)
          .then (res)->
            res.should.be.an.Array
            res.length.should.equal 3
            done()
        , done)

    describe 'GET', ->
      it "should catch notFound errors", (done)->
        spyCount = 0
        trycatch( ->
          db.get('not defined')
          .catch (err)->
            _.error err, 'GET err'
            spyCount++
          .then (res)->
            spyCount.should.equal 0
            expect(res).to.equal undefined
            done()
        , done)

    describe 'UPDATE', ->
      it "should update the value", (done)->
        trycatch( ->
          db.put 'a', {b: 'c'}
          .then ->
            db.update 'a', {d: 'e'}
            .then ->
              db.get 'a'
              .then (val)->
                val.should.be.an.Object
                expect(val.b).to.equal undefined
                val.d.should.equal 'e'
                done()
        , done)

    describe 'PATCH', ->
      it "should update the value", (done)->
        trycatch( ->
          db.put 'a', {b: 'c'}
          .then ->
            db.patch 'a', {d: 'e'}
            .then ->
              db.get 'a'
              .then (val)->
                val.should.be.an.Object
                val.b.should.equal 'c'
                val.d.should.equal 'e'
                done()
        , done)
__ = require('config').root
_ = __.require 'builders', 'utils'

should = require 'should'
expect = require('chai').expect
trycatch = require 'trycatch'

Promise = require 'bluebird'

notifs_ = __.require 'lib', 'notifications'


describe 'Notifications', ->
  describe 'add', ->
    it "should return a promise", (done)->
      trycatch( ->
        notifs_.add 'aUserId', 'aType', {some: 'data'}
        .then -> done()
        .catch (err)-> throw new Error(err)
      , done)

    it "should throw on wrong argument", (done)->
      trycatch( ->
        (-> notifs_.add('aUserId', 'aType', {some: 'data'})).should.not.throw()
        (-> notifs_.add()).should.throw()
        (-> notifs_.add('aUserId')).should.throw()
        (-> notifs_.add('aUserId', null)).should.throw()
        (-> notifs_.add('aUserId', null, {some: 'data'})).should.throw()
        (-> notifs_.add('aUserId', 'aType', null)).should.throw()
        (-> notifs_.add(null, 'aType', {some: 'data'})).should.throw()
        (-> notifs_.add('aUserId', {some: 'data'}, 'aType')).should.throw()
        done()
      , done)

    it "should have put the object", (done)->
      trycatch( ->
        value = notifs_.getValue 'aType', {some: 'data'}
        key = notifs_.getKey 'aUserId', value.time
        notifs_.API.put(key, value)
        .then (res)->
          notifs_.API.get(key)
          .then (res)->
            _.log res, 'res'
            res.type.should.equal 'aType'
            res.data.some.should.equal 'data'
            res.status.should.equal 'unread'
            res.time.should.equal(value.time)
            done()
          .catch (err)-> throw new Error(err)
      , done)


  describe 'getUserNotifications', ->
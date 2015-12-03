# valid tests but fail in offline mode making it unreliable
# tests should not have such an dependency on environment to pass

# CONFIG = require('config')
# __ = CONFIG.universalPath
# _ = __.require 'builders', 'utils'
# should = require 'should'
# sinon = require 'sinon'
# promises_ = __.require 'lib', 'promises'

# pathname = "/api/entities/public"
# root = CONFIG.fullHost()
# path = root + pathname

# errorCount = -> promises_.get root + "/error/count"

# assertZeroError = (done, label)->
#   errorCount()
#   .then (res)->
#     _.info(String(res.count), "error count @#{label}").should.equal('0')
#     done()

# describe 'env', ->
#   it "should start with 0 error", (done)->
#     assertZeroError(done, 'env')

# describe 'Entities', ->
#   describe 'action', ->
#     describe 'search', ->

#       describe 'byIsbn', ->
#         it "should have no error", (done)->
#           url = path + "?action=search&search=978-2081-2178-29&language=en"
#           promises_.get url
#           .then (res)->
#             res.should.be.an.Object
#             for source, data of res
#               data.items.should.be.an.Array
#               data.source.should.equal source
#             assertZeroError(done, 'byIsbn')

#       describe 'byText', ->
#         it "should have no error", (done)->
#           url = path + "?action=search&search=harry potter&language=en"
#           promises_.get url
#           .then (res)->
#             res.should.be.an.Object
#             for source, data of res
#               data.items.should.be.an.Array
#             assertZeroError(done, 'byText')

#     describe 'get-images', ->
#       it "should have no error", (done)->
#         entity = "isbn:9780938978008"
#         url = path + "?action=get-images&entity=#{entity}"
#         promises_.get url
#         .then (res)->
#           res.should.be.an.Array
#           console.log 'res', res
#           res.images.should.be.an.Object
#           res.images[0].should.be.an.String
#           assertZeroError(done, 'getimages')

#     describe 'get-isbn-entities', ->
#       it "should have no error", (done)->
#         data = "Les Misérables"
#         isbns = "978-2081-2178-29|9782070368228"
#         url = path + "?action=getisbnentities&isbns=#{isbns}"
#         promises_.get url
#         .then (res)->
#           res.should.be.an.Object
#           assertZeroError(done, 'getisbnentities')

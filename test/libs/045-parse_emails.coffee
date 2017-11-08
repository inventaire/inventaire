CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'

should = require 'should'
parseEmails = __.require 'controllers', 'invitations/lib/parse_emails'
userEmail = 'bla@bla.bla'

describe 'parse emails', ->
  it 'should be a function', (done)->
    parseEmails.should.be.a.Function()
    done()

  it 'should take a string email list and return an array of strings', (done)->
    parseEmails('a@bla.org,b@bla.org', userEmail).should.be.an.Array()
    parseEmails('a@bla.org,b@bla.org', userEmail)[0].should.equal 'a@bla.org'
    parseEmails('a@bla.org,b@bla.org', userEmail)[1].should.equal 'b@bla.org'
    done()

  it 'should return emails lowercased', (done)->
    parseEmails('BLAbla@bla.org', userEmail).should.be.an.Array()
    parseEmails('BLAbla@bla.org', userEmail)[0].should.equal 'blabla@bla.org'
    done()

  it 'should accept emails separated by a comma', (done)->
    emails = 'a@bla.org, b@bla.org, c@bla.org'
    parseEmails(emails, userEmail)[0].should.equal 'a@bla.org'
    parseEmails(emails, userEmail)[1].should.equal 'b@bla.org'
    parseEmails(emails, userEmail)[2].should.equal 'c@bla.org'
    done()

  it 'should accept emails separated by a newline break', (done)->
    emails = """
    a@bla.org
    b@bla.org;
    c@bla.org
    """
    parseEmails(emails, userEmail)[0].should.equal 'a@bla.org'
    parseEmails(emails, userEmail)[1].should.equal 'b@bla.org'
    parseEmails(emails, userEmail)[2].should.equal 'c@bla.org'
    done()

  it 'should accept emails separated by a semi-colon', (done)->
    emails = 'a@bla.org;b@bla.org; c@bla.org'
    parseEmails(emails, userEmail)[0].should.equal 'a@bla.org'
    parseEmails(emails, userEmail)[1].should.equal 'b@bla.org'
    parseEmails(emails, userEmail)[2].should.equal 'c@bla.org'
    done()

  it 'should reject invalid emails', (done)->
    (-> parseEmails(';;;;;', userEmail)).should.throw()
    (-> parseEmails(';a;b;z;da;@azd', userEmail)).should.throw()
    (-> parseEmails(';a;b;z;da;bla@azd.fr', userEmail)).should.throw()
    done()

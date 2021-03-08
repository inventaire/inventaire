const CONFIG = require('config')
const __ = CONFIG.universalPath

require('should')
const parseEmails = require('controllers/invitations/lib/parse_emails')

describe('parse emails', () => {
  it('should be a function', () => {
    parseEmails.should.be.a.Function()
  })

  it('should take a string email list and return an array of strings', () => {
    const emails = 'a@bla.org,b@bla.org, "Bob Example" <bob@example.com>'
    parseEmails(emails).should.be.an.Array()
    parseEmails(emails)[0].should.equal('a@bla.org')
    parseEmails(emails)[1].should.equal('b@bla.org')
    parseEmails(emails)[2].should.equal('bob@example.com')
  })

  it('should return emails lowercased', () => {
    parseEmails('BLAbla@bla.org').should.be.an.Array()
    parseEmails('BLAbla@bla.org')[0].should.equal('blabla@bla.org')
  })

  it('should accept emails separated by a comma', () => {
    const emails = 'a@bla.org, b@bla.org, c@bla.org'
    parseEmails(emails)[0].should.equal('a@bla.org')
    parseEmails(emails)[1].should.equal('b@bla.org')
    parseEmails(emails)[2].should.equal('c@bla.org')
  })

  it('should accept emails separated by a newline break', () => {
    const emails = 'a@bla.org\nb@bla.org;\nc@bla.org\n'
    parseEmails(emails)[0].should.equal('a@bla.org')
    parseEmails(emails)[1].should.equal('b@bla.org')
    parseEmails(emails)[2].should.equal('c@bla.org')
  })

  it('should accept emails separated by a semi-colon', () => {
    const emails = 'a@bla.org;b@bla.org; c@bla.org'
    parseEmails(emails)[0].should.equal('a@bla.org')
    parseEmails(emails)[1].should.equal('b@bla.org')
    parseEmails(emails)[2].should.equal('c@bla.org')
  })

  it('should reject invalid emails', () => {
    (() => parseEmails(';;;;;')).should.throw();
    (() => parseEmails(';a;b;z;da;@azd')).should.throw();
    (() => parseEmails(';a;b;z;da;bla@azd.fr')).should.throw()
  })
})

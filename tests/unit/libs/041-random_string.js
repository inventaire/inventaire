
import 'should'
import randomString from 'lib/utils/random_string'

describe('random string', () => {
  it('should return a string of the requested length', () => {
    randomString(1).length.should.equal(1)
    randomString(2).length.should.equal(2)
    randomString(32).length.should.equal(32)
    randomString(623).length.should.equal(623)
    randomString(1000).length.should.equal(1000)
  })
})

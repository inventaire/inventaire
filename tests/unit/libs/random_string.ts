import 'should'
import { getRandomString } from '#lib/utils/random_string'

describe('random string', () => {
  it('should return a string of the requested length', () => {
    getRandomString(1).length.should.equal(1)
    getRandomString(2).length.should.equal(2)
    getRandomString(32).length.should.equal(32)
    getRandomString(623).length.should.equal(623)
    getRandomString(1000).length.should.equal(1000)
  })
})

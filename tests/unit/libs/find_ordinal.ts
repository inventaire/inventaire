import should from 'should'
import { findOrdinalBetween } from '#lib/find_ordinal'
import { getRandomString } from '#lib/utils/random_string'

describe('findOrdinalBetween', () => {
  it('should find an ordinal between two ordinals', () => {
    const ordinalA = '00000'
    const ordinalB = 'zzzzzzz'
    const ordinalC = findOrdinalBetween(ordinalA, ordinalB)
    should(ordinalC > ordinalA).be.true()
    should(ordinalC < ordinalB).be.true()
  })

  it('should find an ordinal when not all characters in the two ordinals are compare in the same direction', () => {
    const ordinalA = 'azU'
    const ordinalB = 'ba'
    const ordinalC = findOrdinalBetween(ordinalA, ordinalB)
    should(ordinalC > ordinalA).be.true()
    should(ordinalC < ordinalB).be.true()
  })

  it('should find an ordinal between two random ordinals', () => {
    let i = 0
    while (i++ < 100) {
      let ordinalA = getRandomString(10).replace(/[_]]g/, '').toLowerCase()
      let ordinalB = getRandomString(10).replace(/[_]]g/, '').toLowerCase()
      if (ordinalA > ordinalB) [ ordinalA, ordinalB ] = [ ordinalB, ordinalA ]
      const ordinalC = findOrdinalBetween(ordinalA, ordinalB)
      should(ordinalC > ordinalA).be.true()
      should(ordinalC < ordinalB).be.true()
    }
  })

  it('should always be able to find an ordinal between two very close ordinals', () => {
    let i = 0
    let ordinalA = 'abcd'
    const ordinalB = 'abce'
    while (i++ < 100) {
      const ordinalC = findOrdinalBetween(ordinalA, ordinalB)
      should(ordinalC > ordinalA).be.true()
      should(ordinalC < ordinalB).be.true()
      ordinalA = ordinalC
    }
  })
})

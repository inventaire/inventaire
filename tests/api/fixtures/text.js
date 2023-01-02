import { readFileSync } from 'node:fs'
import _ from '#builders/utils'
import { absolutePath } from '#lib/absolute_path'
import { getRandomString } from '#lib/utils/random_string'

const getFixtureWords = filename => {
  return readFileSync(absolutePath('tests', `api/fixtures/${filename}`))
  .toString()
  .split('\n')
}
const lorem = getFixtureWords('words')
// no name should match on regex /\W/
const firstNames = getFixtureWords('names')

const capitalize = word => word[0].toUpperCase() + word.slice(1).toLowerCase()

export const randomWords = (numberOfWords, suffix = '') => _.sampleSize(lorem, numberOfWords).join(' ').concat(suffix)

export const firstName = () => _.sampleSize(firstNames, 1)[0]

export const username = () => firstName() + getRandomString(4)
export const sentence = () => capitalize(randomWords(20)) + '.'
export const randomLongWord = wordLength => {
  const longWord = randomWords(wordLength).replaceAll(' ', '').slice(0, wordLength + 10)
  return capitalize(longWord)
}
export const humanName = () => `${firstName()} ${firstName()}`
export const email = () => `${firstName()}@${firstName()}.org`

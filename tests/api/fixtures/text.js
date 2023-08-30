import { readFileSync } from 'node:fs'
import { sampleSize } from 'lodash-es'
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

export const randomWords = (numberOfWords = 3, suffix = '') => sampleSize(lorem, numberOfWords).join(' ').concat(suffix)

export const firstName = () => sampleSize(firstNames, 1)[0]

// Add a random string to prevent creating several users with the same username
// and be rejected because of it
export const getSomeUsername = () => firstName() + getRandomString(4)
export const sentence = () => capitalize(randomWords(20)) + '.'
export const randomLongWord = wordLength => {
  const longWord = randomWords(wordLength).replaceAll(' ', '').slice(0, wordLength + 10)
  return capitalize(longWord)
}

export const humanName = () => `${firstName()} ${firstName()}`
export const getSomeEmail = () => `${firstName()}@${firstName()}.org`

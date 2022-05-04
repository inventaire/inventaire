const _ = require('builders/utils')
const __ = require('config').universalPath
const randomString = require('lib/utils/random_string')
const { readFileSync } = require('node:fs')
const getFixtureWords = filename => {
  return readFileSync(__.path('tests', `api/fixtures/${filename}`))
  .toString()
  .split('\n')
}
const lorem = getFixtureWords('words')
// no name should match on regex /\W/
const firstNames = getFixtureWords('names')

const capitalize = word => word[0].toUpperCase() + word.slice(1).toLowerCase()

const randomWords = (numberOfWords, suffix = '') => _.sampleSize(lorem, numberOfWords).join(' ').concat(suffix)

const firstName = () => _.sampleSize(firstNames, 1)[0]

module.exports = {
  randomWords,
  username: () => firstName() + randomString(4),
  firstName,
  sentence: () => capitalize(randomWords(20)) + '.',
  randomLongWord: wordLength => {
    const longWord = randomWords(wordLength).replaceAll(' ', '').slice(0, wordLength + 10)
    return capitalize(longWord)
  },
  humanName: () => `${firstName()} ${firstName()}`,
  email: () => `${firstName()}@${firstName()}.org`
}

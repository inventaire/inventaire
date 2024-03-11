import { sampleSize } from 'lodash-es'
import { someNames } from '#fixtures/names'
import { someWords } from '#fixtures/words'
import { getRandomString } from '#lib/utils/random_string'

const capitalize = word => word[0].toUpperCase() + word.slice(1).toLowerCase()

export const randomWords = (numberOfWords = 3, suffix = '') => sampleSize(someWords, numberOfWords).join(' ').concat(suffix)

export const firstName = () => sampleSize(someNames, 1)[0]

// Add a random string to prevent creating several users with the same username
// and be rejected because of it
export const getSomeUsername = () => firstName() + getRandomString(4)
export const sentence = () => capitalize(randomWords(20)) + '.'
export function randomLongWord (wordLength) {
  const longWord = randomWords(wordLength).replaceAll(' ', '').slice(0, wordLength + 10)
  return capitalize(longWord)
}

export const humanName = () => `${firstName()} ${firstName()}`
export const getSomeEmail = () => `${firstName()}@${firstName()}.org`

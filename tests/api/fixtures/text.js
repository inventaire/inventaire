const faker = require('faker')

const capitalize = word => word[0].toUpperCase() + word.slice(1).toLowerCase()

const randomWords = (numberOfWords = 5) => faker.random.words(numberOfWords)

module.exports = {
  humanName: () => faker.fake('{{name.firstName}} {{name.lastName}}'),

  randomWords,

  randomLongWord: wordLength => {
    const longWord = randomWords(wordLength).replace(/ /g, '').slice(0, wordLength + 10)
    return capitalize(longWord)
  },
}

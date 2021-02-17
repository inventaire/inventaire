const faker = require('faker')

module.exports = {
  humanName: () => faker.fake('{{name.firstName}} {{name.lastName}}'),

  randomWords: (numberOfWords = 5) => faker.random.words(numberOfWords),
}

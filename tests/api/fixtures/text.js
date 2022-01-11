const _ = require('builders/utils')
const randomString = require('lib/utils/random_string')

const lorem = [
  'comitatus', 'bos', 'volubilis', 'cibus',
  'caelestis', 'supplanto', 'aqua', 'tergum',
  'trepide', 'tergeo', 'tam', 'curiositas',
  'acervus', 'beneficium', 'sui', 'conor',
  'audax', 'verus', 'celo', 'tibi',
  'antepono', 'bellum', 'deludo', 'adinventitias',
  'commodo', 'trado', 'talus', 'casso',
  'aegrus', 'cimentarius', 'sortitus', 'vinculum',
  'congregatio', 'aiunt', 'conicio', 'terga',
  'vomer', 'creo', 'utrimque', 'dedico',
  'tristis', 'antiquus', 'cicuta', 'defetiscor',
  'timidus', 'sollers', 'vir', 'arbustum',
  'tracto', 'talio', 'strues', 'comedo',
  'dens', 'combibo', 'stabilis', 'thesis',
  'clam', 'vilis', 'delinquo', 'absque',
  'desidero', 'auxilium', 'substantia', 'sumo',
  'avarus', 'cerno', 'deleo', 'abduco',
  'conventus', 'cum', 'vinum', 'bibo',
  'defungo', 'colligo', 'arceo', 'charisma',
  'adipiscor', 'corroboro', 'triumphus', 'ascisco',
  'turpis', 'ustulo', 'vicinus', 'supellex',
  'carus', 'cunctatio', 'sollicito', 'creptio',
  'amissio', 'cognatus', 'cupiditas', 'armarium',
  'utpote', 'sto', 'curis', 'ancilla',
  'tenuis', 'cursus', 'termes', 'sublime'
]

// no name should match on regex /\W/
const firstNames = [
  'Nikki', 'Rey', 'Miracle', 'Amanda', 'Betty', 'Stephania',
  'Julie', 'Davonte', 'Lilian', 'Kaylin', 'Rocio', 'Nash',
  'Phyllis', 'Simeon', 'Elsie', 'Ben', 'Aubrey', 'Jaime',
  'Carolyne', 'Sam', 'Edmond', 'Abraham', 'Francisco', 'Queen',
  'Sheila', 'Lora', 'Jed', 'Torrance', 'Lamont', 'Cleta',
  'Petra', 'Renee', 'Sadie', 'Ernesto', 'Earlene', 'Allison',
  'Constance', 'Ellie', 'Henri', 'Maegan', 'Janis', 'Oren',
  'Otis', 'Jaleel', 'Federico', 'Katarina', 'Isom', 'Brenda',
  'Opal', 'Orrin', 'Rene', 'Murl', 'Lela', 'Alisa',
  'Cecil', 'Zaria', 'Richie', 'Aric', 'Vivienne', 'Zora',
  'Chelsey', 'Frida', 'Rachael', 'Enrique', 'Eldridge', 'Cullen',
  'Estevan', 'Gilberto', 'Virginie', 'Paige', 'Noemi', 'Nellie',
  'Matt', 'Marilie', 'Alexanne', 'Abdiel', 'Maya', 'Timmothy',
  'Bette', 'Adan', 'Charley', 'Kaden', 'Shirley', 'Vivien',
  'Maximo', 'Liliane', 'Morris', 'Rickey', 'Vincenza', 'Ivy',
  'Elwin', 'Okey', 'Lincoln', 'Harvey', 'Amir', 'Callie',
  'Jerod', 'Mercedes', 'Hilma', 'Aiyana'
]

const capitalize = word => word[0].toUpperCase() + word.slice(1).toLowerCase()

const randomWords = (numberOfWords, suffix = '') => _.sampleSize(lorem, numberOfWords).join(' ').concat(suffix)

const firstName = () => _.sampleSize(firstNames, 1)[0]

module.exports = {
  randomWords,
  username: () => firstName() + randomString(4),
  firstName,
  sentence: () => capitalize(randomWords(20)) + '.',
  randomLongWord: wordLength => {
    const longWord = randomWords(wordLength).replace(/ /g, '').slice(0, wordLength + 10)
    return capitalize(longWord)
  },
  humanName: () => `${firstName()} ${firstName()}`,
  email: () => `${firstName()}@${firstName()}.org`
}

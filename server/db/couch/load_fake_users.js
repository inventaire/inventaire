const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const breq = require('bluereq')
const someFakeUsernames = [
  'bobby', 'tony', 'luigi', 'rocky', 'shanapaul', 'Hubert_Bonisseur_de_la_Bath',
  'bambi', 'bartolome', 'boris', 'bastogne', 'baraka',
  'babidi', 'boo', 'bamboo', 'baratin'
]

// TODO: fix me
const usersDbUrl = null

module.exports = () => {
  someFakeUsernames.forEach(loadFakeUser)
  return _.range(0, 50).map(i => loadFakeUser())
}

const loadFakeUser = username => {
  return breq.get('http://api.randomuser.me/')
  .then(getUserData.bind(null, username))
  .then(postUser)
  .catch(_.Error('loadFakeUser'))
}

const getUserData = (username, res) => {
  const fake = res.body.results[0].user
  return {
    username: username || fake.username,
    email: fake.email,
    picture: fake.picture.medium,
    created: Date.now()
  }
}

const postUser = data => {
  return breq.post(usersDbUrl, data)
  .then(res => _.info(res.body, 'postUser'))
  .catch(_.Error('postUser'))
}

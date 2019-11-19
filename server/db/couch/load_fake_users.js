// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const bluereq = require('bluereq')

module.exports = () => {
  [
    'bobby', 'tony', 'luigi', 'rocky', 'shanapaul', 'Hubert_Bonisseur_de_la_Bath',
    'bambi', 'bartolome', 'boris', 'bastogne', 'baraka',
    'babidi', 'boo', 'bamboo', 'baratin'
  ]
  .forEach(loadFakeUser)
  return __range__(1, 50, true).map(i => loadFakeUser())
}

const loadFakeUser = username => bluereq.get('http://api.randomuser.me/')
.then(getUserData.bind(null, username))
.then(postUser)
.catch(_.Error('loadFakeUser'))

const getUserData = (username, res) => {
  let userData
  const fake = res.body.results[0].user
  return userData = {
    username: username || fake.username,
    email: fake.email,
    picture: fake.picture.medium,
    created: Date.now()
  }
}

const postUser = data => bluereq.post(usersDbUrl, data)
.then(res => _.info(res.body, 'postUser'))
.catch(_.Error('postUser'))

function __range__ (left, right, inclusive) {
  const range = []
  const ascending = left < right
  const end = !inclusive ? right : ascending ? right + 1 : right - 1
  for (let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
    range.push(i)
  }
  return range
}

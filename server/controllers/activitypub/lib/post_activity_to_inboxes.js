const _ = require('builders/utils')
const formatActivitiesDocs = require('./format_activities_docs')
const requests_ = require('lib/requests')
const { signRequest } = require('controllers/activitypub/lib/security')
const error_ = require('lib/error/error')
const { getFollowActivitiesByObject } = require('./activities')
// Arbitrary timeout
const timeout = 30 * 1000

const postActivityToInbox = ({ activity, privateKey }) => async followActivity => {
  const uri = followActivity.actor.uri
  if (!uri) return
  let actorRes
  try {
    actorRes = await requests_.get(uri, { timeout })
  } catch (err) {
    throw error_.new('Cannot fetch remote actor information, cannot post activity', 400, { uri, activity, err })
  }
  const inboxUri = actorRes.inbox
  if (!inboxUri) return _.log('No inbox found, cannot post activity', uri)

  const postHeaders = signRequest({ method: 'post', keyUrl: inboxUri, privateKey })
  postHeaders['content-type'] = 'application/activity+json'
  try {
    return requests_.post(inboxUri, { headers: postHeaders, body: activity, timeout })
  } catch (err) {
    throw error_.new('Posting activity to inbox failed', 400, { inboxUri, activity, err })
  }
}

const postActivityToInboxes = user => async activityDoc => {
  const followActivities = await getFollowActivitiesByObject(user.username)
  const activities = await formatActivitiesDocs([ activityDoc ], user)
  const activity = activities[0]
  return Promise.all(followActivities.map(postActivityToInbox({ activity, privateKey: user.privateKey })))
}

module.exports = { postActivityToInbox, postActivityToInboxes }

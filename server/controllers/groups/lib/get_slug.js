
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
let groups_ = __.require('controllers', 'groups/lib/groups')
const getNextSlugCandidate = require('./get_next_slug_candidate')
const slugify = require('./slugify')

// Working around the circular dependency
groups_ = null
const lateRequire = () => { groups_ = require('./groups') }
setTimeout(lateRequire, 0)

module.exports = (name, groupId) => trySlugCandidate(slugify(name), groupId)

const trySlugCandidate = (slug, groupId) => groups_.bySlug(slug)
.then(group => {
  // A group was found with that slug
  // If the group matches the passed group id,
  // it's ok, the group can keep it's current slug
  if (group._id === groupId) {
    return slug
  // else, try with an iterated versiongroupId
  } else {
    return trySlugCandidate(getNextSlugCandidate(slug), groupId)
  }
}).catch(err => {
  // No group was found with that slug, it's available!
  if (err.statusCode === 404) {
    return slug
  } else {
    throw err
  }
})

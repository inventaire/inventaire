import getNextSlugCandidate from './get_next_slug_candidate.js'
import slugify from './slugify.js'

let groups_
const requireCircularDependencies = () => { groups_ = require('./groups') }
setImmediate(requireCircularDependencies)

const getSlug = (name, groupId) => trySlugCandidate(slugify(name), groupId)

export default {
  get: getSlug,

  add: async group => {
    const slug = await getSlug(group.name, group._id)
    group.slug = slug
    return group
  }
}

const trySlugCandidate = (slug, groupId) => {
  return groups_.bySlug(slug)
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
  })
  .catch(err => {
    // No group was found with that slug, it's available!
    if (err.statusCode === 404) return slug
    else throw err
  })
}

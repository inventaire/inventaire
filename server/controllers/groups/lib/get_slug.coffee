CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
groups_ = __.require 'controllers', 'groups/lib/groups'
getNextSlugCandidate = require './get_next_slug_candidate'
slugify = require './slugify'

module.exports = (groups_)->
  trySlugCandidate = (slug, groupId)->
    _.log slug, 'trySlugCandidate'
    groups_.bySlug slug
    .then (group)->
      console.log('group', group)
      # A group was found with that slug
      # If the group matches the passed group id,
      # it's ok, the group can keep it's current slug
      if group._id is groupId then return slug
      # else, try with an iterated versiongroupId
      else return trySlugCandidate getNextSlugCandidate(slug), groupId
    .catch (err)->
      # No group was found with that slug, it's available!
      if err.statusCode is 404 then return slug
      else throw err

  return getSlug = (name, groupId)-> trySlugCandidate slugify(name), groupId

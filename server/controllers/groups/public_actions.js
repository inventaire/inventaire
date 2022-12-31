import _ from 'builders/utils'
import groups_ from './lib/groups'
import getGroupPublicData from './lib/group_public_data'
import { get as getSlug } from './lib/slug'

export default {
  byId: {
    sanitization: { id: {} },
    controller: async ({ id, reqUserId }) => {
      return getGroupPublicData('byId', [ id ], reqUserId)
    }
  },

  bySlug: {
    sanitization: { slug: {} },
    controller: async ({ slug, reqUserId }) => {
      return getGroupPublicData('bySlug', [ slug ], reqUserId)
    }
  },

  searchByPositon: {
    sanitization: { bbox: {} },
    controller: async ({ bbox }) => {
      let groups = await groups_.byPosition(bbox)
      groups = groups.filter(searchable)
      return { groups }
    }
  },

  slug: {
    sanitization: {
      name: {},
      group: { optional: true }
    },
    controller: async ({ name, groupId }) => {
      const slug = await getSlug(name, groupId)
      return { slug }
    }
  }
}

const searchable = _.property('searchable')

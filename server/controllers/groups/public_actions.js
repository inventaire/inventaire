import { property } from 'lodash-es'
import { getGroupsByPosition } from '#controllers/groups/lib/groups'
import getGroupPublicData from './lib/group_public_data.js'
import { getSlug } from './lib/slug.js'

export default {
  byId: {
    sanitization: { id: {} },
    controller: async ({ id, reqUserId }) => {
      return getGroupPublicData('byId', [ id ], reqUserId)
    },
  },

  bySlug: {
    sanitization: { slug: {} },
    controller: async ({ slug, reqUserId }) => {
      return getGroupPublicData('bySlug', [ slug ], reqUserId)
    },
  },

  searchByPositon: {
    sanitization: { bbox: {} },
    controller: async ({ bbox }) => {
      let groups = await getGroupsByPosition(bbox)
      groups = groups.filter(searchable)
      return { groups }
    },
  },

  slug: {
    sanitization: {
      name: {},
      group: { optional: true },
    },
    controller: async ({ name, groupId }) => {
      const slug = await getSlug(name, groupId)
      return { slug }
    },
  },
}

const searchable = property('searchable')

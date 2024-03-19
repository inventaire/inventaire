import { property } from 'lodash-es'
import { getGroupById, getGroupBySlug, getGroupsByPosition } from '#controllers/groups/lib/groups'
import { notFoundError } from '#lib/error/error'
import getGroupPublicData from './lib/group_public_data.js'
import { getSlug } from './lib/slug.js'

export default {
  byId: {
    sanitization: { id: {} },
    controller: async ({ id, reqUserId }) => {
      const group = await getGroupById(id)
      if (!group) throw notFoundError({ id })
      return getGroupPublicData(group, reqUserId)
    },
  },

  bySlug: {
    sanitization: { slug: {} },
    controller: async ({ slug, reqUserId }) => {
      const group = await getGroupBySlug(slug)
      if (!group) throw notFoundError({ slug })
      return getGroupPublicData(group, reqUserId)
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

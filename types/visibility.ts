import type { visibilityKeywords } from '#models/validations/visibility'
import type { GroupId } from '#types/group'

export type VisibilityKeyword = typeof visibilityKeywords[number]
export type VisibilityGroupKey = `group:${GroupId}`
export type VisibilityKey = VisibilityKeyword | VisibilityGroupKey

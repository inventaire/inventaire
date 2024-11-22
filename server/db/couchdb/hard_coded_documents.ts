import type { SpecialUser } from '#types/user'

export const specialUserDocBase = {
  // TODO: replace with type: 'special' for consistency with the other docs in the database
  special: true,
  // Data required to avoid crashing users logic
  snapshot: {},
  settings: {
    notifications: {
      global: false,
    },
    contributions: {
      anonymize: false,
    },
  },
} as const

function buildSpecialUserDoc (username, idLastCharacters) {
  const specialUser: Omit<SpecialUser, '_rev' | 'type' | 'stableUsername' | 'roles'> = {
    _id: `00000000000000000000000000000${idLastCharacters}`,
    username,
    ...specialUserDocBase,
  }
  return specialUser
}

export const hardCodedUsers = {
  // A fake user used to sign entities edit generated from dataseed
  // see server/data/dataseed/dataseed.js
  seed: buildSpecialUserDoc('seed', '000'),
  // see server/controllers/entities/lib/update_claims_hooks
  hook: buildSpecialUserDoc('hook', '001'),
  reconciler: buildSpecialUserDoc('reconciler', '002'),
  // used by scripts/update_entities.js
  updater: buildSpecialUserDoc('updater', '003'),
}

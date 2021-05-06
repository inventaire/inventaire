// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

const attributes = module.exports = {}

attributes.updatable = [
  'description',
  'listing',
  'name',
  'owner'
]

attributes.constrained = {
  listing: {
    possibilities: [ 'private', 'network', 'public' ],
    defaultValue: 'private'
  }
}

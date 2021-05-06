// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

module.exports = {
  // Attributes that can be changed by an admin with a simple validity check
  updatable: [
    'name',
    'picture',
    'description',
    'searchable',
    'position',
    'open'
  ],

  usersLists: [
    'admins',
    'members',
    'invited',
    'declined',
    'requested'
  ]
}

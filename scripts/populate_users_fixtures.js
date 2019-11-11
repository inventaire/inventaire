#!/usr/bin/env node
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const { createUserWithItems } = require('../api_tests/fixtures/populate');

createUserWithItems()
.then(function(userCreated){
  _.success('#### New User available ####');
  console.log(`Your can now login with :\n\
- Username : ${userCreated.username} \n\
- Password : 12345678`
  );
  return process.exit(0);}).catch(_.Error(err));

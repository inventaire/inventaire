/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const should = require('should');
const { undesiredErr } = __.require('apiTests', 'utils/utils');
const { createTransaction, addMessage } = require('../fixtures/transactions');
const { authReq } = __.require('apiTests', 'utils/utils');

describe('transactions:get:messages', () => it('should get a transaction messages', function(done){
  createTransaction()
  .then(function(res1){
    const { transaction, userA, userB, userBItem } = res1;
    const { _id } = transaction;
    return addMessage(transaction)
    .then(res2 => authReq('get', `/api/transactions?action=get-messages&transaction=${_id}`)
    .then(function(res3){
      res3.messages.should.be.an.Array();
      should(res3.messages.length > 0).be.true();
      return done();
    }));}).catch(undesiredErr(done));

}));

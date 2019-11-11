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

describe('transactions:post:message', () => it('should create a transaction', function(done){
  createTransaction()
  .then(function(res1){
    const { transaction, userA, userB, userBItem } = res1;
    return addMessage(transaction)
    .then(function(res2){
      res2.ok.should.be.true();
      return done();
    });}).catch(undesiredErr(done));

}));

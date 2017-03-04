'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

exports.default = createQueue;

var _mongomq = require('mongomq');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function createQueue(options) {
  return new _mongomq.MongoMQ((0, _extends3.default)({
    databaseName: 'jubaopeng-server',
    queueCollection: 'tx_lock_queue',
    autoStart: true
  }, options));
}
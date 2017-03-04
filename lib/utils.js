'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.randomStr = exports.debug = undefined;

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

exports.sleep = sleep;

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function sleep(ms) {
  if (ms < 0) ms = 0;
  return new _promise2.default(function (resolve) {
    return setTimeout(resolve, ms);
  });
}
var debug = exports.debug = (0, _debug2.default)('mongo-tx');

var randomStr = exports.randomStr = function randomStr() {
  var bytes = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 4;

  var hex = _crypto2.default.randomBytes(bytes).toString('hex');
  return parseInt(hex, 16).toString(36);
};
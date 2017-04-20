'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _mongomq = require('mongomq');

var _ascoltatori = require('ascoltatori');

var _ascoltatori2 = _interopRequireDefault(_ascoltatori);

var _pify = require('pify');

var _pify2 = _interopRequireDefault(_pify);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var pAscoltatori = (0, _pify2.default)(_ascoltatori2.default);

exports.default = function () {
  var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(options) {
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            return _context.abrupt('return', pAscoltatori.build((0, _extends3.default)({
              type: 'mongo',
              pubsubCollection: 'ascoltatori',
              mongo: {} }, options)));

          case 1:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  function createQueue(_x) {
    return _ref.apply(this, arguments);
  }

  return createQueue;
}();

// export default function createQueue(options) {
//   return new MongoMQ({
//     databaseName: 'jubaopeng-server',
//     queueCollection: 'tx_lock_queue',
//     autoStart: true,
//     ...options
//   })
// }
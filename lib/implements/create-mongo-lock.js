'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var waitForRelease = function () {
  var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(queue, name, expire, e) {
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            return _context.abrupt('return', new _promise2.default(function (resolve, reject) {
              var now = Date.now();
              var resolved = false;
              setTimeout(function () {
                if (resolved) return;
                resolved = true;
                reject(getTimeoutError(name, expire, e));
              }, expire - now);
              queue.once(queueMsgName(name), function () {
                if (!resolved) {
                  resolved = true;
                  resolve();
                }
              });
            }));

          case 1:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function waitForRelease(_x, _x2, _x3, _x4) {
    return _ref.apply(this, arguments);
  };
}();

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _pify = require('pify');

var _pify2 = _interopRequireDefault(_pify);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _errors = require('../errors');

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _utils = require('../utils');

var _createMongoMq = require('./create-mongo-mq');

var _createMongoMq2 = _interopRequireDefault(_createMongoMq);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var pFs = (0, _pify2.default)(_fs2.default);

function getTimeoutError(name, expire, e) {
  return new _errors.LockedWaitTimeoutError(name + '(wait timeout: ' + new Date().toISOString() + ' >= ' + new Date(expire).toISOString() + ')', e);
}

var queueMsgName = function queueMsgName(name) {
  return name + ':release';
};

exports.default = function () {
  var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      db = _ref2.db,
      _ref2$collectionName = _ref2.collectionName,
      collectionName = _ref2$collectionName === undefined ? 'tx_locks' : _ref2$collectionName,
      _ref2$defaultTimeout = _ref2.defaultTimeout,
      defaultTimeout = _ref2$defaultTimeout === undefined ? 30 * 1000 : _ref2$defaultTimeout,
      _ref2$notDelete = _ref2.notDelete,
      notDelete = _ref2$notDelete === undefined ? false : _ref2$notDelete,
      _ref2$writeConcern = _ref2.writeConcern,
      writeConcern = _ref2$writeConcern === undefined ? {
    w: 1,
    wtimeout: 2000,
    j: 1
  } : _ref2$writeConcern,
      _ref2$queue = _ref2.queue,
      queue = _ref2$queue === undefined ? (0, _createMongoMq2.default)({ databaseName: db.databaseName }) : _ref2$queue,
      _ref2$wait = _ref2.wait,
      wait = _ref2$wait === undefined ? false : _ref2$wait,
      _ref2$maxWaitTime = _ref2.maxWaitTime,
      maxWaitTime = _ref2$maxWaitTime === undefined ? 5000 : _ref2$maxWaitTime;

  if (!db) {
    throw new Error('Parameter options.db shouldn\'t be null!');
  }
  var col = void 0;

  var Lock = function () {
    function Lock(name) {
      var _ref3 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
          _ref3$timeout = _ref3.timeout,
          timeout = _ref3$timeout === undefined ? defaultTimeout : _ref3$timeout,
          lockedMsg = _ref3.lockedMsg;

      (0, _classCallCheck3.default)(this, Lock);

      this.name = name;
      this.timeout = timeout;
      this.message = lockedMsg;
    }

    (0, _createClass3.default)(Lock, [{
      key: 'lock',
      value: function () {
        var _ref4 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2() {
          var start = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : Date.now();
          var now;
          return _regenerator2.default.wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  if (col) {
                    _context2.next = 8;
                    break;
                  }

                  _context2.next = 3;
                  return db.collection(collectionName, writeConcern);

                case 3:
                  col = _context2.sent;
                  _context2.next = 6;
                  return col.createIndex({ name: 1 }, { unique: true });

                case 6:
                  _context2.next = 8;
                  return col.createIndex({ expire: 1 });

                case 8:
                  // clean expired
                  now = new Date();

                  if (!notDelete) {
                    _context2.next = 14;
                    break;
                  }

                  _context2.next = 12;
                  return col.update({
                    name: this.name,
                    expire: { $lt: now },
                    expired: { $exists: false }
                  }, {
                    name: this.name + ':' + now.toISOString() + ':' + (0, _utils.randomStr)(),
                    expired: now
                  });

                case 12:
                  _context2.next = 16;
                  break;

                case 14:
                  _context2.next = 16;
                  return col.deleteOne({
                    name: this.name,
                    expire: { $lt: now }
                  });

                case 16:
                  _context2.prev = 16;
                  _context2.next = 19;
                  return col.insertOne({
                    name: this.name,
                    expire: new Date(Date.now() + this.timeout)
                  });

                case 19:
                  _context2.next = 37;
                  break;

                case 21:
                  _context2.prev = 21;
                  _context2.t0 = _context2['catch'](16);

                  if (!_context2.t0) {
                    _context2.next = 37;
                    break;
                  }

                  if (!(_context2.t0.code === 11000)) {
                    _context2.next = 36;
                    break;
                  }

                  _context2.t0.stack = null; // use out stack

                  if (!wait) {
                    _context2.next = 33;
                    break;
                  }

                  _context2.next = 29;
                  return waitForRelease(queue, this.name, start + maxWaitTime, _context2.t0);

                case 29:
                  _context2.next = 31;
                  return this.lock(start);

                case 31:
                  _context2.next = 34;
                  break;

                case 33:
                  throw new _errors.LockedError(this.name, _context2.t0);

                case 34:
                  _context2.next = 37;
                  break;

                case 36:
                  throw _context2.t0;

                case 37:
                case 'end':
                  return _context2.stop();
              }
            }
          }, _callee2, this, [[16, 21]]);
        }));

        function lock() {
          return _ref4.apply(this, arguments);
        }

        return lock;
      }()
    }, {
      key: 'release',
      value: function () {
        var _ref5 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3() {
          var now;
          return _regenerator2.default.wrap(function _callee3$(_context3) {
            while (1) {
              switch (_context3.prev = _context3.next) {
                case 0:
                  _context3.prev = 0;

                  if (!notDelete) {
                    _context3.next = 7;
                    break;
                  }

                  now = new Date();
                  _context3.next = 5;
                  return col.update({
                    name: this.name
                  }, {
                    name: this.name + ':' + now.toISOString() + ':' + (0, _utils.randomStr)(),
                    released: now
                  });

                case 5:
                  _context3.next = 9;
                  break;

                case 7:
                  _context3.next = 9;
                  return col.deleteOne({
                    name: this.name
                  });

                case 9:
                  if (!wait) {
                    _context3.next = 12;
                    break;
                  }

                  _context3.next = 12;
                  return queue.emit(queueMsgName(this.name), 1);

                case 12:
                  return _context3.abrupt('return', true);

                case 15:
                  _context3.prev = 15;
                  _context3.t0 = _context3['catch'](0);

                  console.warn('Release failed', _context3.t0);
                  return _context3.abrupt('return', false);

                case 19:
                case 'end':
                  return _context3.stop();
              }
            }
          }, _callee3, this, [[0, 15]]);
        }));

        function release() {
          return _ref5.apply(this, arguments);
        }

        return release;
      }()
    }]);
    return Lock;
  }();

  return function (name, opts) {
    return new Lock(name, opts);
  };
};
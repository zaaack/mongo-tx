'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

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
              var msgName = queueMsgName(name);
              setTimeout(function () {
                if (resolved) return;
                resolved = true;
                reject(getTimeoutError(name, expire, e));
              }, expire - now);

              queue.once(msgName, function listener(err, data) {
                if (err) {
                  reject(err);
                  return;
                }
                if (data) {
                  resolve();
                } else {
                  queue.once(msgName, listener);
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
  return new _errors.LockedWaitTimeoutError(name + '(wait timeout: ' + new Date(expire).toISOString() + ')', e);
}

var queueMsgName = function queueMsgName(name) {
  return name + ':release';
};

var col = void 0;

var Lock = function () {
  function Lock(name, options) {
    (0, _classCallCheck3.default)(this, Lock);

    this.name = name;
    this.options = options;
  }

  (0, _createClass3.default)(Lock, [{
    key: 'lock',
    value: function () {
      var _ref2 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2() {
        var _ref3 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
            _ref3$wait = _ref3.wait,
            wait = _ref3$wait === undefined ? this.options.wait : _ref3$wait,
            _ref3$start = _ref3.start,
            start = _ref3$start === undefined ? Date.now() : _ref3$start;

        var _options, collectionName, writeConcern, db, notDelete, queue, maxWaitTime, maxLockTime, now;

        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _options = this.options, collectionName = _options.collectionName, writeConcern = _options.writeConcern, db = _options.db, notDelete = _options.notDelete, queue = _options.queue, maxWaitTime = _options.maxWaitTime, maxLockTime = _options.maxLockTime;

                if (col) {
                  _context2.next = 9;
                  break;
                }

                _context2.next = 4;
                return db.collection(collectionName, writeConcern);

              case 4:
                col = _context2.sent;
                _context2.next = 7;
                return col.createIndex({ name: 1 }, { unique: true });

              case 7:
                _context2.next = 9;
                return col.createIndex({ expire: 1 });

              case 9:
                // clean expired
                now = new Date();

                if (!notDelete) {
                  _context2.next = 15;
                  break;
                }

                _context2.next = 13;
                return col.update({
                  name: this.name,
                  expire: { $lt: now },
                  expired: { $exists: false }
                }, {
                  name: this.name + ':' + now.toISOString() + ':' + (0, _utils.randomStr)(),
                  expired: now
                });

              case 13:
                _context2.next = 17;
                break;

              case 15:
                _context2.next = 17;
                return col.deleteOne({
                  name: this.name,
                  expire: { $lt: now }
                });

              case 17:
                _context2.prev = 17;
                _context2.next = 20;
                return col.insertOne({
                  name: this.name,
                  expire: new Date(Date.now() + maxLockTime)
                });

              case 20:
                _context2.next = 39;
                break;

              case 22:
                _context2.prev = 22;
                _context2.t0 = _context2['catch'](17);

                if (!_context2.t0) {
                  _context2.next = 39;
                  break;
                }

                if (!(_context2.t0.code === 11000)) {
                  _context2.next = 38;
                  break;
                }

                _context2.t0.stack = null; // use out stack

                if (!wait) {
                  _context2.next = 35;
                  break;
                }

                _context2.next = 30;
                return waitForRelease(queue, this.name, start + maxWaitTime, _context2.t0);

              case 30:
                (0, _utils.debug)('lock again');
                _context2.next = 33;
                return this.lock({ start: start, wait: wait });

              case 33:
                _context2.next = 36;
                break;

              case 35:
                throw new _errors.LockedError(this.name, _context2.t0);

              case 36:
                _context2.next = 39;
                break;

              case 38:
                throw _context2.t0;

              case 39:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this, [[17, 22]]);
      }));

      function lock() {
        return _ref2.apply(this, arguments);
      }

      return lock;
    }()
  }, {
    key: 'release',
    value: function () {
      var _ref4 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3() {
        var _options2, collectionName, writeConcern, db, notDelete, wait, queue, maxWaitTime, now;

        return _regenerator2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _options2 = this.options, collectionName = _options2.collectionName, writeConcern = _options2.writeConcern, db = _options2.db, notDelete = _options2.notDelete, wait = _options2.wait, queue = _options2.queue, maxWaitTime = _options2.maxWaitTime;
                _context3.prev = 1;

                if (!notDelete) {
                  _context3.next = 8;
                  break;
                }

                now = new Date();
                _context3.next = 6;
                return col.update({
                  name: this.name
                }, {
                  name: this.name + ':' + now.toISOString() + ':' + (0, _utils.randomStr)(),
                  released: now
                });

              case 6:
                _context3.next = 10;
                break;

              case 8:
                _context3.next = 10;
                return col.deleteOne({
                  name: this.name
                });

              case 10:
                if (wait) {
                  queue.emit(queueMsgName(this.name), 1);
                }
                return _context3.abrupt('return', true);

              case 14:
                _context3.prev = 14;
                _context3.t0 = _context3['catch'](1);

                console.warn('Release failed', _context3.t0);
                return _context3.abrupt('return', false);

              case 18:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this, [[1, 14]]);
      }));

      function release() {
        return _ref4.apply(this, arguments);
      }

      return release;
    }()
  }]);
  return Lock;
}();

var defaults = {
  db: null,
  collectionName: 'tx_locks',
  maxLockTime: 2 * 60 * 1000,
  notDelete: true,
  writeConcern: {
    w: 1,
    wtimeout: 2000,
    j: 1
  },
  onError: function onError(err) {
    return console.error(err);
  },
  queue: null,
  wait: false, // throws error when wait is false and is already locked
  maxWaitTime: 20 * 1000
};

exports.default = function (options) {
  if (!options.db) {
    throw new Error('Parameter options.db shouldn\'t be null!');
  }
  options = (0, _assign2.default)({}, defaults, options);
  if (options.wait && !options.queue) {
    options.queue = (0, _createMongoMq2.default)({ databaseName: options.db.databaseName });
  }
  return function (name, opts) {
    return new Lock(name, (0, _assign2.default)({}, options, opts));
  };
};
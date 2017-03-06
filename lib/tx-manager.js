'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fixCrash = undefined;

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

/**
 * fix transactions after a crash, rollback all rollingback, commit all committing transactions.
 * @return
 */
var fixCrash = exports.fixCrash = function () {
  var _ref10 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee10() {
    var _options4, createModel, createLock, txModelName, txModel, txLock, txDocs, txDoc, txManager;

    return _regenerator2.default.wrap(function _callee10$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            _options4 = this.options, createModel = _options4.createModel, createLock = _options4.createLock, txModelName = _options4.txModelName;

            _txModel = _txModel || createModel(txModelName);
            txModel = _txModel;
            txLock = createLock('MongoTx:fixCrash');
            _context10.next = 6;
            return txLock.lock();

          case 6:
            txDocs = txModel.find();
            _context10.t0 = _regenerator2.default.keys(txDocs);

          case 8:
            if ((_context10.t1 = _context10.t0()).done) {
              _context10.next = 22;
              break;
            }

            txDoc = _context10.t1.value;
            txManager = new TxManager(txDoc, this.options);
            _context10.t2 = txDoc.state;
            _context10.next = _context10.t2 === 'running' ? 14 : _context10.t2 === 'rollingback' ? 14 : _context10.t2 === 'committing' ? 17 : 20;
            break;

          case 14:
            _context10.next = 16;
            return txManager.rollback();

          case 16:
            return _context10.abrupt('break', 20);

          case 17:
            _context10.next = 19;
            return txManager.commit();

          case 19:
            return _context10.abrupt('break', 20);

          case 20:
            _context10.next = 8;
            break;

          case 22:
            _context10.next = 24;
            return txLock.release();

          case 24:
          case 'end':
            return _context10.stop();
        }
      }
    }, _callee10, this);
  }));

  return function fixCrash() {
    return _ref10.apply(this, arguments);
  };
}();

exports.default = MongoTx;

var _modelWrapper = require('./model-wrapper');

var _modelWrapper2 = _interopRequireDefault(_modelWrapper);

var _errors = require('./errors');

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var defaults = {
  txModelName: '__tx_manager',
  createModel: null,
  createLock: null,
  txTimeout: 0,
  commitRetry: 3,
  commitInterval: 300,
  rollbackRetry: 3,
  rollbackInterval: 300
};

var _txModel = null;

var TxManager = function () {
  function TxManager(nameOrTx, options) {
    (0, _classCallCheck3.default)(this, TxManager);

    if ((typeof nameOrTx === 'undefined' ? 'undefined' : (0, _typeof3.default)(nameOrTx)) === 'object' && nameOrTx._id) {
      this.tx = nameOrTx;
      this.name = nameOrTx._id;
    } else if (typeof nameOrTx === 'string') {
      this.name = nameOrTx;
    } else {
      throw new Error('Illegal parameter nameOrTx:', nameOrTx);
    }
    this.options = (0, _assign2.default)({}, defaults, options);
    var _options = this.options,
        txTimeout = _options.txTimeout,
        createModel = _options.createModel,
        createLock = _options.createLock,
        txModelName = _options.txModelName;
    // if (txTimeout <= 0) { // TODO: timeout ?
    //   txTimeout = Infinity
    // }

    if (!_txModel) {
      _txModel = createModel(txModelName);
    }
    this.txModel = _txModel;
    this.txLock = createLock('transaction:' + this.name);
    this.models = [];
  }

  (0, _createClass3.default)(TxManager, [{
    key: 'wrap',
    value: function wrap(model) {
      var createModel = this.options.createModel;

      var modelInterface = createModel(model);
      var wrappedModel = new _modelWrapper2.default(modelInterface, (0, _assign2.default)({
        txModel: this.txModel,
        tx: this.tx
      }, this.options));
      this.models.push(wrappedModel);
      return wrappedModel;
    }
  }, {
    key: 'updateTxState',
    value: function () {
      var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee() {
        var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'running';
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this.txModel.findOneAndUpdate({ _id: this.tx._id }, {
                  $set: { state: state }
                }, {
                  returnOriginal: false
                });

              case 2:
                this.tx = _context.sent;

              case 3:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function updateTxState() {
        return _ref.apply(this, arguments);
      }

      return updateTxState;
    }()
  }, {
    key: 'start',
    value: function () {
      var _ref2 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2() {
        var timeout;
        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return this.txLock.lock();

              case 2:
                (0, _utils.debug)('tx:', this.name, 'start');
                timeout = this.options.timeout;
                _context2.next = 6;
                return this.txModel.create({
                  _id: this.name,
                  name: this.name,
                  // expire: new Date(Date.now() + timeout),
                  snapshots: {},
                  state: 'running'
                });

              case 6:
                this.tx = _context2.sent;

              case 7:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function start() {
        return _ref2.apply(this, arguments);
      }

      return start;
    }()
  }, {
    key: 'run',
    value: function () {
      var _ref3 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3(fn) {
        return _regenerator2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return this.start();

              case 2:
                _context3.prev = 2;
                _context3.next = 5;
                return fn(this);

              case 5:
                _context3.prev = 5;
                _context3.next = 8;
                return this.commit(this.options.retry);

              case 8:
                _context3.next = 13;
                break;

              case 10:
                _context3.prev = 10;
                _context3.t0 = _context3['catch'](5);
                throw new _errors.CommitError('tx: ' + this.tx.name, _context3.t0);

              case 13:
                _context3.next = 26;
                break;

              case 15:
                _context3.prev = 15;
                _context3.t1 = _context3['catch'](2);
                _context3.prev = 17;
                _context3.next = 20;
                return this.rollback(this.options.retry);

              case 20:
                _context3.next = 25;
                break;

              case 22:
                _context3.prev = 22;
                _context3.t2 = _context3['catch'](17);
                throw new _errors.RollbackError('tx: ' + this.tx.name, _context3.t2);

              case 25:
                throw _context3.t1;

              case 26:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this, [[2, 15], [5, 10], [17, 22]]);
      }));

      function run(_x2) {
        return _ref3.apply(this, arguments);
      }

      return run;
    }()
  }, {
    key: 'retry',
    value: function () {
      var _ref4 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4(fn) {
        var _retry = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 3;

        var retryInterval = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 300;
        var i;
        return _regenerator2.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                i = 0;

              case 1:
                if (!(i < _retry)) {
                  _context4.next = 20;
                  break;
                }

                _context4.prev = 2;

                (0, _utils.debug)('tx:', this.name, 'retry', fn.name, i);
                _context4.next = 6;
                return fn();

              case 6:
                _context4.next = 16;
                break;

              case 8:
                _context4.prev = 8;
                _context4.t0 = _context4['catch'](2);

                if (!(_context4.t0 instanceof _errors.RetryableError)) {
                  _context4.next = 15;
                  break;
                }

                console.error(_context4.t0);
                _context4.next = 14;
                return (0, _utils.sleep)(retryInterval);

              case 14:
                return _context4.abrupt('continue', 17);

              case 15:
                throw _context4.t0;

              case 16:
                return _context4.abrupt('return');

              case 17:
                i++;
                _context4.next = 1;
                break;

              case 20:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this, [[2, 8]]);
      }));

      function retry(_x3) {
        return _ref4.apply(this, arguments);
      }

      return retry;
    }()
  }, {
    key: 'commit',
    value: function () {
      var _ref5 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee6() {
        var _this = this;

        var _options2, commitRetry, commitRetryInterval;

        return _regenerator2.default.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                (0, _utils.debug)('tx:', this.name, 'committing');
                _context6.next = 3;
                return this.updateTxState('committing');

              case 3:
                _options2 = this.options, commitRetry = _options2.commitRetry, commitRetryInterval = _options2.commitRetryInterval;
                _context6.next = 6;
                return this.retry((0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee5() {
                  var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, wrapedModel;

                  return _regenerator2.default.wrap(function _callee5$(_context5) {
                    while (1) {
                      switch (_context5.prev = _context5.next) {
                        case 0:
                          _iteratorNormalCompletion = true;
                          _didIteratorError = false;
                          _iteratorError = undefined;
                          _context5.prev = 3;
                          _iterator = (0, _getIterator3.default)(_this.models);

                        case 5:
                          if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
                            _context5.next = 12;
                            break;
                          }

                          wrapedModel = _step.value;
                          _context5.next = 9;
                          return wrapedModel.commit();

                        case 9:
                          _iteratorNormalCompletion = true;
                          _context5.next = 5;
                          break;

                        case 12:
                          _context5.next = 18;
                          break;

                        case 14:
                          _context5.prev = 14;
                          _context5.t0 = _context5['catch'](3);
                          _didIteratorError = true;
                          _iteratorError = _context5.t0;

                        case 18:
                          _context5.prev = 18;
                          _context5.prev = 19;

                          if (!_iteratorNormalCompletion && _iterator.return) {
                            _iterator.return();
                          }

                        case 21:
                          _context5.prev = 21;

                          if (!_didIteratorError) {
                            _context5.next = 24;
                            break;
                          }

                          throw _iteratorError;

                        case 24:
                          return _context5.finish(21);

                        case 25:
                          return _context5.finish(18);

                        case 26:
                        case 'end':
                          return _context5.stop();
                      }
                    }
                  }, _callee5, _this, [[3, 14, 18, 26], [19,, 21, 25]]);
                })), commitRetry, commitRetryInterval);

              case 6:
                (0, _utils.debug)('tx:', this.name, 'finish');
                _context6.next = 9;
                return this.finish();

              case 9:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function commit() {
        return _ref5.apply(this, arguments);
      }

      return commit;
    }()
  }, {
    key: 'rollback',
    value: function () {
      var _ref7 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee8() {
        var _this2 = this;

        var _options3, rollbackRetry, rollbackRetryInterval;

        return _regenerator2.default.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                (0, _utils.debug)('tx:', this.name, 'rollingback');
                _context8.next = 3;
                return this.updateTxState('rollingback');

              case 3:
                _options3 = this.options, rollbackRetry = _options3.rollbackRetry, rollbackRetryInterval = _options3.rollbackRetryInterval;
                _context8.next = 6;
                return this.retry((0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee7() {
                  var _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, wrapedModel;

                  return _regenerator2.default.wrap(function _callee7$(_context7) {
                    while (1) {
                      switch (_context7.prev = _context7.next) {
                        case 0:
                          _iteratorNormalCompletion2 = true;
                          _didIteratorError2 = false;
                          _iteratorError2 = undefined;
                          _context7.prev = 3;
                          _iterator2 = (0, _getIterator3.default)(_this2.models);

                        case 5:
                          if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
                            _context7.next = 12;
                            break;
                          }

                          wrapedModel = _step2.value;
                          _context7.next = 9;
                          return wrapedModel.rollback();

                        case 9:
                          _iteratorNormalCompletion2 = true;
                          _context7.next = 5;
                          break;

                        case 12:
                          _context7.next = 18;
                          break;

                        case 14:
                          _context7.prev = 14;
                          _context7.t0 = _context7['catch'](3);
                          _didIteratorError2 = true;
                          _iteratorError2 = _context7.t0;

                        case 18:
                          _context7.prev = 18;
                          _context7.prev = 19;

                          if (!_iteratorNormalCompletion2 && _iterator2.return) {
                            _iterator2.return();
                          }

                        case 21:
                          _context7.prev = 21;

                          if (!_didIteratorError2) {
                            _context7.next = 24;
                            break;
                          }

                          throw _iteratorError2;

                        case 24:
                          return _context7.finish(21);

                        case 25:
                          return _context7.finish(18);

                        case 26:
                        case 'end':
                          return _context7.stop();
                      }
                    }
                  }, _callee7, _this2, [[3, 14, 18, 26], [19,, 21, 25]]);
                })), rollbackRetry, rollbackRetryInterval);

              case 6:
                (0, _utils.debug)('tx:', this.name, 'finish');
                _context8.next = 9;
                return this.finish();

              case 9:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function rollback() {
        return _ref7.apply(this, arguments);
      }

      return rollback;
    }()
  }, {
    key: 'finish',
    value: function () {
      var _ref9 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee9() {
        return _regenerator2.default.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                _context9.next = 2;
                return this.txModel.findOneAndRemove({ _id: this.name });

              case 2:
                _context9.next = 4;
                return this.txLock.release();

              case 4:
              case 'end':
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      function finish() {
        return _ref9.apply(this, arguments);
      }

      return finish;
    }()
  }]);
  return TxManager;
}();

function MongoTx(options) {
  function createTx(name, fn) {
    var txMgr = new TxManager(name, options);
    if (fn) {
      return txMgr.run(fn);
    }
    return txMgr;
  }
  createTx.options = options;
  createTx.fixCrash = fixCrash;
  return createTx;
}
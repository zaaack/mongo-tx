'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _mongodb = require('mongodb');

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ModelWrapper = function () {
  function ModelWrapper(model, options) {
    var _this = this;

    (0, _classCallCheck3.default)(this, ModelWrapper);

    this.model = model;
    this.options = options;
    var tx = options.tx,
        createLock = options.createLock,
        txModel = options.txModel,
        txTimeout = options.txTimeout;

    this.tx = tx;
    this.txModel = txModel;
    this.createLock = function (id) {
      return _this.constructor.createDocLock(model.name(), id, options);
    };
    this.locks = {};
  }

  (0, _createClass3.default)(ModelWrapper, [{
    key: 'name',
    value: function name() {
      return this.model.name();
    }
  }, {
    key: '_snapId',
    value: function _snapId(docId) {
      return 'snapshots.' + this.name() + '_' + docId;
    }
  }, {
    key: 'snapshot',
    value: function () {
      var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(doc) {
        var action = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'update';
        var txId;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                txId = this.tx._id;

                if (!this.tx.snapshots[this.name() + '_' + doc._id]) {
                  _context.next = 3;
                  break;
                }

                return _context.abrupt('return');

              case 3:
                _context.next = 5;
                return this.txModel.findOneAndUpdate({ _id: txId }, {
                  $set: (0, _defineProperty3.default)({}, this._snapId(doc._id), {
                    tx_id: txId,
                    action: action,
                    doc: doc
                  })
                }, {
                  returnOriginal: false
                });

              case 5:
                this.tx = _context.sent;

                (0, _utils.debug)('this.tx', this.tx);

              case 7:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function snapshot(_x) {
        return _ref.apply(this, arguments);
      }

      return snapshot;
    }()
  }, {
    key: 'findOne',
    value: function () {
      var _ref2 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(match) {
        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                return _context2.abrupt('return', this.model.findOne(match));

              case 1:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function findOne(_x3) {
        return _ref2.apply(this, arguments);
      }

      return findOne;
    }()
  }, {
    key: 'find',
    value: function () {
      var _ref3 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3(match) {
        return _regenerator2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                return _context3.abrupt('return', this.model.find(match));

              case 1:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function find(_x4) {
        return _ref3.apply(this, arguments);
      }

      return find;
    }()
  }, {
    key: 'lock',
    value: function () {
      var _ref4 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4(id) {
        var _lock;

        return _regenerator2.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                id = id.toString();

                if (id in this.locks) {
                  _context4.next = 6;
                  break;
                }

                _lock = this.createLock(id.toString());
                _context4.next = 5;
                return _lock.lock();

              case 5:
                this.locks[id] = _lock;

              case 6:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function lock(_x5) {
        return _ref4.apply(this, arguments);
      }

      return lock;
    }()
  }, {
    key: 'release',
    value: function () {
      var _ref5 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee5(id) {
        var lock;
        return _regenerator2.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                lock = this.createLock(id.toString());
                _context5.next = 3;
                return lock.release();

              case 3:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function release(_x6) {
        return _ref5.apply(this, arguments);
      }

      return release;
    }()
  }, {
    key: 'create',
    value: function () {
      var _ref6 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee6(doc) {
        return _regenerator2.default.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                doc._id = (0, _mongodb.ObjectId)();
                _context6.next = 3;
                return this.lock(doc._id);

              case 3:
                _context6.next = 5;
                return this.snapshot(doc, 'create');

              case 5:
                _context6.next = 7;
                return this.model.create(doc);

              case 7:
                doc = _context6.sent;
                return _context6.abrupt('return', doc);

              case 9:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function create(_x7) {
        return _ref6.apply(this, arguments);
      }

      return create;
    }()
  }, {
    key: 'findOneAndUpdate',
    value: function () {
      var _ref7 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee7(match, updateDocument, options) {
        var doc;
        return _regenerator2.default.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                _context7.next = 2;
                return this.model.findOne(match);

              case 2:
                doc = _context7.sent;

                if (doc) {
                  _context7.next = 5;
                  break;
                }

                return _context7.abrupt('return', doc);

              case 5:
                _context7.next = 7;
                return this.lock(doc._id);

              case 7:
                _context7.next = 9;
                return this.snapshot(doc, 'update');

              case 9:
                _context7.next = 11;
                return this.model.findOneAndUpdate(match, updateDocument, options);

              case 11:
                return _context7.abrupt('return', _context7.sent);

              case 12:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function findOneAndUpdate(_x8, _x9, _x10) {
        return _ref7.apply(this, arguments);
      }

      return findOneAndUpdate;
    }()
  }, {
    key: 'findOneAndRemove',
    value: function () {
      var _ref8 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee8(match, options) {
        var doc;
        return _regenerator2.default.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                _context8.next = 2;
                return this.model.findOne(match);

              case 2:
                doc = _context8.sent;

                if (doc) {
                  _context8.next = 5;
                  break;
                }

                return _context8.abrupt('return', doc);

              case 5:
                _context8.next = 7;
                return this.lock(doc._id);

              case 7:
                _context8.next = 9;
                return this.snapshot(doc, 'remove');

              case 9:
                _context8.next = 11;
                return this.model.findOneAndRemove(match, options);

              case 11:
                return _context8.abrupt('return', doc);

              case 12:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function findOneAndRemove(_x11, _x12) {
        return _ref8.apply(this, arguments);
      }

      return findOneAndRemove;
    }()
  }, {
    key: 'removeSnap',
    value: function () {
      var _ref9 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee9(docId) {
        var ret;
        return _regenerator2.default.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                _context9.next = 2;
                return this.txModel.findOneAndUpdate({ _id: this.tx._id }, {
                  $unset: (0, _defineProperty3.default)({}, this._snapId(docId), '')
                }, {
                  returnOriginal: false
                });

              case 2:
                ret = _context9.sent;

                this.tx = ret || this.tx;

              case 4:
              case 'end':
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      function removeSnap(_x13) {
        return _ref9.apply(this, arguments);
      }

      return removeSnap;
    }()
  }, {
    key: 'commit',
    value: function () {
      var _ref10 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee10() {
        var snaps, snapId, doc;
        return _regenerator2.default.wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                snaps = this.tx.snapshots;
                _context10.t0 = _regenerator2.default.keys(snaps);

              case 2:
                if ((_context10.t1 = _context10.t0()).done) {
                  _context10.next = 11;
                  break;
                }

                snapId = _context10.t1.value;
                doc = snaps[snapId].doc;
                _context10.next = 7;
                return this.removeSnap(doc._id);

              case 7:
                _context10.next = 9;
                return this.release(doc._id);

              case 9:
                _context10.next = 2;
                break;

              case 11:
              case 'end':
                return _context10.stop();
            }
          }
        }, _callee10, this);
      }));

      function commit() {
        return _ref10.apply(this, arguments);
      }

      return commit;
    }()
  }, {
    key: 'rollback',
    value: function () {
      var _ref11 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee11() {
        var snaps, snapId, _snaps$snapId, action, doc;

        return _regenerator2.default.wrap(function _callee11$(_context11) {
          while (1) {
            switch (_context11.prev = _context11.next) {
              case 0:
                snaps = this.tx.snapshots;
                _context11.t0 = _regenerator2.default.keys(snaps);

              case 2:
                if ((_context11.t1 = _context11.t0()).done) {
                  _context11.next = 30;
                  break;
                }

                snapId = _context11.t1.value;
                _snaps$snapId = snaps[snapId], action = _snaps$snapId.action, doc = _snaps$snapId.doc;
                _context11.prev = 5;
                _context11.t2 = action;
                _context11.next = _context11.t2 === 'create' ? 9 : _context11.t2 === 'update' ? 12 : _context11.t2 === 'remove' ? 15 : 18;
                break;

              case 9:
                _context11.next = 11;
                return this.model.findOneAndRemove({ _id: doc._id });

              case 11:
                return _context11.abrupt('break', 18);

              case 12:
                _context11.next = 14;
                return this.model.findOneAndUpdate({ _id: doc._id }, doc);

              case 14:
                return _context11.abrupt('break', 18);

              case 15:
                _context11.next = 17;
                return this.model.create(doc);

              case 17:
                return _context11.abrupt('break', 18);

              case 18:
                _context11.next = 20;
                return this.removeSnap(doc._id);

              case 20:
                _context11.next = 22;
                return this.release(doc._id);

              case 22:
                _context11.next = 28;
                break;

              case 24:
                _context11.prev = 24;
                _context11.t3 = _context11['catch'](5);

                console.error('Module [' + this.model.name + '] rollback error in transaction: ' + this.tx.name + ' (_id: ' + this.tx._id + ')');
                throw _context11.t3;

              case 28:
                _context11.next = 2;
                break;

              case 30:
              case 'end':
                return _context11.stop();
            }
          }
        }, _callee11, this, [[5, 24]]);
      }));

      function rollback() {
        return _ref11.apply(this, arguments);
      }

      return rollback;
    }()
  }], [{
    key: 'createDocLock',
    value: function createDocLock(colName, docId) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this.options;
      var createLock = options.createLock;

      return createLock('document:' + colName + '_' + docId);
    }
  }]);
  return ModelWrapper;
}();

exports.default = ModelWrapper;
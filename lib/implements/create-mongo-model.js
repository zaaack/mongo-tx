'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _pify = require('pify');

var _pify2 = _interopRequireDefault(_pify);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _lodash = require('lodash.result');

var _lodash2 = _interopRequireDefault(_lodash);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var toJson = function toJson(m) {
  return m && m.get();
};

exports.default = function () {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      _ref$opts = _ref.opts,
      opts = _ref$opts === undefined ? { // overwrite WriteConcern
    w: 1,
    wtimeout: 5000,
    j: 1
  } : _ref$opts,
      db = _ref.db;

  if (!db) {
    throw new Error('Parameter options.db shouldn\'t be null!');
  }
  return function createModel(collectionName) {
    return {
      name: function name() {
        return collectionName;
      },
      getCol: function getCol() {
        var _this = this;

        return (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee() {
          return _regenerator2.default.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  if (_this._col) {
                    _context.next = 4;
                    break;
                  }

                  _context.next = 3;
                  return db.collection(collectionName, opts);

                case 3:
                  _this._col = _context.sent;

                case 4:
                  return _context.abrupt('return', _this._col);

                case 5:
                case 'end':
                  return _context.stop();
              }
            }
          }, _callee, _this);
        }))();
      },
      create: function create(doc) {
        var _this2 = this;

        return (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2() {
          var col, ret;
          return _regenerator2.default.wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  _context2.next = 2;
                  return _this2.getCol();

                case 2:
                  col = _context2.sent;
                  _context2.next = 5;
                  return col.insertOne(doc);

                case 5:
                  ret = _context2.sent;

                  doc._id = ret.ops[0]._id;
                  return _context2.abrupt('return', doc);

                case 8:
                case 'end':
                  return _context2.stop();
              }
            }
          }, _callee2, _this2);
        }))();
      },
      find: function find(match) {
        var _this3 = this;

        return (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3() {
          var col;
          return _regenerator2.default.wrap(function _callee3$(_context3) {
            while (1) {
              switch (_context3.prev = _context3.next) {
                case 0:
                  _context3.next = 2;
                  return _this3.getCol();

                case 2:
                  col = _context3.sent;
                  _context3.next = 5;
                  return col.find(match).toArray();

                case 5:
                  return _context3.abrupt('return', _context3.sent);

                case 6:
                case 'end':
                  return _context3.stop();
              }
            }
          }, _callee3, _this3);
        }))();
      },
      index: function index(field, options) {
        var _this4 = this;

        return (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4() {
          var col;
          return _regenerator2.default.wrap(function _callee4$(_context4) {
            while (1) {
              switch (_context4.prev = _context4.next) {
                case 0:
                  _context4.next = 2;
                  return _this4.getCol();

                case 2:
                  col = _context4.sent;
                  return _context4.abrupt('return', col.createIndex(field, options));

                case 4:
                case 'end':
                  return _context4.stop();
              }
            }
          }, _callee4, _this4);
        }))();
      },
      findOne: function findOne(match) {
        var _this5 = this;

        return (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee5() {
          var col;
          return _regenerator2.default.wrap(function _callee5$(_context5) {
            while (1) {
              switch (_context5.prev = _context5.next) {
                case 0:
                  _context5.next = 2;
                  return _this5.getCol();

                case 2:
                  col = _context5.sent;
                  return _context5.abrupt('return', col.find(match).limit(1).next());

                case 4:
                case 'end':
                  return _context5.stop();
              }
            }
          }, _callee5, _this5);
        }))();
      },
      findOneAndUpdate: function findOneAndUpdate(match, updateDocument, options) {
        var _this6 = this;

        return (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee6() {
          var col, results;
          return _regenerator2.default.wrap(function _callee6$(_context6) {
            while (1) {
              switch (_context6.prev = _context6.next) {
                case 0:
                  _context6.next = 2;
                  return _this6.getCol();

                case 2:
                  col = _context6.sent;
                  _context6.next = 5;
                  return col.findOneAndUpdate(match, updateDocument, options);

                case 5:
                  results = _context6.sent;

                  (0, _utils.debug)('results', results);

                  if (!results.ok) {
                    _context6.next = 11;
                    break;
                  }

                  return _context6.abrupt('return', results.value);

                case 11:
                  (0, _utils.debug)('results not ok', results);

                case 12:
                  return _context6.abrupt('return', null);

                case 13:
                case 'end':
                  return _context6.stop();
              }
            }
          }, _callee6, _this6);
        }))();
      },
      findOneAndRemove: function findOneAndRemove(match, updateDocument, options) {
        var _this7 = this;

        return (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee7() {
          var col, results;
          return _regenerator2.default.wrap(function _callee7$(_context7) {
            while (1) {
              switch (_context7.prev = _context7.next) {
                case 0:
                  _context7.next = 2;
                  return _this7.getCol();

                case 2:
                  col = _context7.sent;
                  _context7.next = 5;
                  return col.findOneAndDelete(match, updateDocument, options);

                case 5:
                  results = _context7.sent;

                  (0, _utils.debug)('findOneAndRemove results', results);

                  if (!results.ok) {
                    _context7.next = 9;
                    break;
                  }

                  return _context7.abrupt('return', results.value);

                case 9:
                  return _context7.abrupt('return', null);

                case 10:
                case 'end':
                  return _context7.stop();
              }
            }
          }, _callee7, _this7);
        }))();
      }
    };
  };
};
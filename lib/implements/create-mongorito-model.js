'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _pify = require('pify');

var _pify2 = _interopRequireDefault(_pify);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _mongorito = require('mongorito');

var _mongorito2 = _interopRequireDefault(_mongorito);

var _lodash = require('lodash.result');

var _lodash2 = _interopRequireDefault(_lodash);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var toJson = function toJson(m) {
  return m && m.get();
};

exports.default = function () {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      _ref$writeConcern = _ref.writeConcern,
      writeConcern = _ref$writeConcern === undefined ? { // overwrite WriteConcern
    w: 1,
    wtimeout: 5000,
    j: 1
  } : _ref$writeConcern,
      db = _ref.db;

  if (!db) {
    throw new Error('Parameter options.db shouldn\'t be null!');
  }
  return function createModel(MongoritoModel) {
    var collectionName = void 0;
    var ParentModel = _mongorito.Model;
    if (typeof MongoritoModel.collection === 'function' && typeof MongoritoModel.collection() === 'string') {
      ParentModel = MongoritoModel;
      collectionName = MongoritoModel.collection();
    } else {
      collectionName = MongoritoModel;
    }
    MongoritoModel = function (_ParentModel) {
      (0, _inherits3.default)(MongoritoModel, _ParentModel);

      function MongoritoModel() {
        (0, _classCallCheck3.default)(this, MongoritoModel);
        return (0, _possibleConstructorReturn3.default)(this, (MongoritoModel.__proto__ || (0, _getPrototypeOf2.default)(MongoritoModel)).apply(this, arguments));
      }

      (0, _createClass3.default)(MongoritoModel, null, [{
        key: 'collection',
        value: function collection() {
          return collectionName;
        }
      }, {
        key: 'dbCollection',
        value: function dbCollection() {
          var _this2 = this;

          return this.connection().then(function (db) {
            var name = (0, _lodash2.default)(_this2, 'collection');
            return db.collection(name, writeConcern);
          });
        }
      }]);
      return MongoritoModel;
    }(ParentModel);
    db.register(MongoritoModel);
    return {
      name: function name() {
        return MongoritoModel.collection();
      },
      create: function create(doc) {
        var _this3 = this;

        return (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee() {
          var docModel;
          return _regenerator2.default.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  docModel = new MongoritoModel(doc);
                  _context.next = 3;
                  return docModel.create(doc);

                case 3:
                  return _context.abrupt('return', toJson(docModel));

                case 4:
                case 'end':
                  return _context.stop();
              }
            }
          }, _callee, _this3);
        }))();
      },
      find: function find(match) {
        var _this4 = this;

        return (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2() {
          return _regenerator2.default.wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  return _context2.abrupt('return', MongoritoModel.find(match).then(function (docs) {
                    return docs.map(toJson);
                  }));

                case 1:
                case 'end':
                  return _context2.stop();
              }
            }
          }, _callee2, _this4);
        }))();
      },
      index: function index(field, options) {
        var _this5 = this;

        return (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3() {
          return _regenerator2.default.wrap(function _callee3$(_context3) {
            while (1) {
              switch (_context3.prev = _context3.next) {
                case 0:
                  return _context3.abrupt('return', MongoritoModel.index(field, options));

                case 1:
                case 'end':
                  return _context3.stop();
              }
            }
          }, _callee3, _this5);
        }))();
      },
      findOne: function findOne(match) {
        var _this6 = this;

        return (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4() {
          return _regenerator2.default.wrap(function _callee4$(_context4) {
            while (1) {
              switch (_context4.prev = _context4.next) {
                case 0:
                  return _context4.abrupt('return', MongoritoModel.findOne(match).then(toJson));

                case 1:
                case 'end':
                  return _context4.stop();
              }
            }
          }, _callee4, _this6);
        }))();
      },
      findOneAndUpdate: function findOneAndUpdate(match, updateDocument, options) {
        var _this7 = this;

        return (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee5() {
          var col, results;
          return _regenerator2.default.wrap(function _callee5$(_context5) {
            while (1) {
              switch (_context5.prev = _context5.next) {
                case 0:
                  _context5.next = 2;
                  return MongoritoModel.dbCollection();

                case 2:
                  col = _context5.sent;
                  _context5.next = 5;
                  return col.findOneAndUpdate(match, updateDocument, options);

                case 5:
                  results = _context5.sent;

                  if (!results.ok) {
                    _context5.next = 8;
                    break;
                  }

                  return _context5.abrupt('return', results.value);

                case 8:
                case 'end':
                  return _context5.stop();
              }
            }
          }, _callee5, _this7);
        }))();
      },
      findOneAndRemove: function findOneAndRemove(match, options) {
        var _this8 = this;

        return (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee6() {
          var col, results;
          return _regenerator2.default.wrap(function _callee6$(_context6) {
            while (1) {
              switch (_context6.prev = _context6.next) {
                case 0:
                  _context6.next = 2;
                  return MongoritoModel.dbCollection();

                case 2:
                  col = _context6.sent;
                  _context6.next = 5;
                  return col.findOneAndDelete(match, options);

                case 5:
                  results = _context6.sent;

                  if (!results.ok) {
                    _context6.next = 8;
                    break;
                  }

                  return _context6.abrupt('return', results.value);

                case 8:
                case 'end':
                  return _context6.stop();
              }
            }
          }, _callee6, _this8);
        }))();
      }
    };
  };
};
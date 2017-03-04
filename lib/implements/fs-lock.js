'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FsLock = undefined;

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _pify = require('pify');

var _pify2 = _interopRequireDefault(_pify);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var pFs = (0, _pify2.default)(_fs2.default);

var FsLock = exports.FsLock = function () {
  function FsLock(name) {
    var dir = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '/tmp/node-mongo-tx-fslock';
    (0, _classCallCheck3.default)(this, FsLock);

    this.name = name;
    this.file = _path2.default.resolve(dir, name + '.lock');
  }

  (0, _createClass3.default)(FsLock, [{
    key: 'lock',
    value: function lock() {
      return pFs.open(this.file, 'wx+').then(function (fd) {
        return pFs.close(fd);
      }).then(function () {
        return true;
      });
    }
  }, {
    key: 'release',
    value: function release() {
      return pFs.unlink(this.file);
    }
  }]);
  return FsLock;
}();
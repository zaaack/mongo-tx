'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RollbackError = exports.CommitError = exports.RetryableError = exports.LockedWaitTimeoutError = exports.LockedError = undefined;

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _create = require('babel-runtime/core-js/object/create');

var _create2 = _interopRequireDefault(_create);

var _setPrototypeOf = require('babel-runtime/core-js/object/set-prototype-of');

var _setPrototypeOf2 = _interopRequireDefault(_setPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// babel don't support extends built-in class
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
// http://stackoverflow.com/questions/33870684/why-doesnt-instanceof-work-on-instances-of-error-subclasses-under-babel-node
var ErrorWrapper = function ErrorWrapper(msg) {
  var rawErr = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  (0, _classCallCheck3.default)(this, ErrorWrapper);

  (0, _setPrototypeOf2.default)(this, this.constructor.prototype);
  this.name = this.constructor.name;
  this.message = msg + ':' + rawErr.message;
  this.stack = rawErr.stack;
  if (!this.stack) {
    Error.captureStackTrace(this, this.constructor);
  }
};

ErrorWrapper.prototype = (0, _create2.default)(Error.prototype);
ErrorWrapper.prototype.constructor = ErrorWrapper;

var LockedError = exports.LockedError = function (_ErrorWrapper) {
  (0, _inherits3.default)(LockedError, _ErrorWrapper);

  function LockedError() {
    (0, _classCallCheck3.default)(this, LockedError);
    return (0, _possibleConstructorReturn3.default)(this, (LockedError.__proto__ || (0, _getPrototypeOf2.default)(LockedError)).apply(this, arguments));
  }

  return LockedError;
}(ErrorWrapper);

var LockedWaitTimeoutError = exports.LockedWaitTimeoutError = function (_LockedError) {
  (0, _inherits3.default)(LockedWaitTimeoutError, _LockedError);

  function LockedWaitTimeoutError() {
    (0, _classCallCheck3.default)(this, LockedWaitTimeoutError);
    return (0, _possibleConstructorReturn3.default)(this, (LockedWaitTimeoutError.__proto__ || (0, _getPrototypeOf2.default)(LockedWaitTimeoutError)).apply(this, arguments));
  }

  return LockedWaitTimeoutError;
}(LockedError);

var RetryableError = exports.RetryableError = function (_ErrorWrapper2) {
  (0, _inherits3.default)(RetryableError, _ErrorWrapper2);

  function RetryableError() {
    (0, _classCallCheck3.default)(this, RetryableError);
    return (0, _possibleConstructorReturn3.default)(this, (RetryableError.__proto__ || (0, _getPrototypeOf2.default)(RetryableError)).apply(this, arguments));
  }

  return RetryableError;
}(ErrorWrapper);

var CommitError = exports.CommitError = function (_RetryableError) {
  (0, _inherits3.default)(CommitError, _RetryableError);

  function CommitError() {
    (0, _classCallCheck3.default)(this, CommitError);
    return (0, _possibleConstructorReturn3.default)(this, (CommitError.__proto__ || (0, _getPrototypeOf2.default)(CommitError)).apply(this, arguments));
  }

  return CommitError;
}(RetryableError);

var RollbackError = exports.RollbackError = function (_RetryableError2) {
  (0, _inherits3.default)(RollbackError, _RetryableError2);

  function RollbackError() {
    (0, _classCallCheck3.default)(this, RollbackError);
    return (0, _possibleConstructorReturn3.default)(this, (RollbackError.__proto__ || (0, _getPrototypeOf2.default)(RollbackError)).apply(this, arguments));
  }

  return RollbackError;
}(RetryableError);
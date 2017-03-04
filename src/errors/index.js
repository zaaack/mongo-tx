// babel don't support extends built-in class
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
// http://stackoverflow.com/questions/33870684/why-doesnt-instanceof-work-on-instances-of-error-subclasses-under-babel-node
class ErrorWrapper {
  constructor(msg, rawErr = {}) {
    Object.setPrototypeOf(this, this.constructor.prototype)
    this.name = this.constructor.name
    this.message = msg + ':' + rawErr.message
    this.stack = rawErr.stack
    if (!this.stack) {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}
ErrorWrapper.prototype = Object.create(Error.prototype)
ErrorWrapper.prototype.constructor = ErrorWrapper

export class LockedError extends ErrorWrapper { }
export class LockedWaitTimeoutError extends LockedError { }

export class RetryableError extends ErrorWrapper { }
export class CommitError extends RetryableError { }
export class RollbackError extends RetryableError { }

 /**
 * generatePasswordResetToken closure
 * @param  {Object} backend   a userfic backend that implements the interface defined in the Userific module
 * @param  {Function} cb      a user-specified callback function that can be used to send the user an email with the reset token
 * @return {[type]}           [description]
 */
var restify = require('restify')
module.exports = function(backend, cb) {
  return function(req, res, next) {
    var outputError, params, errors
    params = req.params
    errors = validateParameters(req)
    if (errors) {
      outputError = new restify.MissingParameterError("generatePasswordResetToken failed")
      outputError.body.errors = errors
      outputError.body.reason = 'missing_parameter'
      return res.send(outputError)
    }
    backend.generatePasswordResetToken(params, function(err, user) {
      var output, outputError
      if (err) {
        var msg = err.message
        outputError = new restify.InternalError(msg)
        return next(outputError)
      }
      if (err && err.reason === 'unconfirmed') {
        outputError = new restify.NotAuthorizedError('generatePasswordResetToken failed')
        outputError.body.reason = err.reason
        return res.send(outputError)
      }
      cb(req, res, user)
    })
  }
};


/**
 * validateParameters
 * @param  {Object} params the posted form data which must contain
 *   oldPassword
 *   newPassword
 * @return {Object} null if the parameters are valid, an error object if they are not
 */

  function validateParameters(req) {
    var errors
    req.assert('email', 'required').isEmail()
    errors = req.validationErrors()
    return errors
  }

var restify = require('restify')
module.exports = function(backend) {
  /**
   * resetPassword route for an existing user. This route should be called via POST request
   * @param  {Request}   req the request object. Note that all user data is
   *   contained in the req.params object.
   * @param  {Response}   res the response object to send data back to the client
   * @param  {Function} next the restify handler to pass control to the next middleware in line
   */
  return function(req, res, next) {
    var outputError, params, errors
      params = req.params
      errors = validateParameters(req)
      if (errors) {
        outputError = new restify.MissingParameterError("reset password failed")
        outputError.body.errors = errors
        outputError.body.reason = 'missing_parameter'
        return res.send(outputError)
      }
    backend.resetPassword(params, function(err, newPassword) {
      var output, outputError
      if (err) {
        var msg = err.message
        outputError = new restify.InternalError(msg)
        return next(outputError)
      }
      if (err && err.reason === 'invalid_token') {
        outputError = new restify.InvalidCredentialsError('invalid reset token')
        outputError.body.reason = err.reason
        return res.send(outputError)
      }
      output = {
        message: 'password reset correctly',
        password: newPassword
      }
      res.send(200, output)
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
  req.assert('resetToken', 'required').notEmpty()
  req.assert('email', 'required').isEmail()
  errors = req.validationErrors()
  return errors
}

/**
 * resetPassword route for an existing user. This route should be called via POST request
 * @param  {Request}   req the request object. Note that all user data is
 *   contained in the req.params object.
 * @param  {Response}   res the response object to send data back to the client
 * @param  {Function} next the restify handler to pass control to the next middleware in line
 */
var restify = require('restify')
module.exports = function(backend) {
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
      res.send(200, user)
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

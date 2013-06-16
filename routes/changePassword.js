var restify = require('restify')
var inspect = require('eyespect').inspector({maxLength: 999999})
/**
 * authenticate an existing user route. This route should be called via POST request
 * @param  {Request}   req the request object. Note that all user data is
 *   contained in the req.params object.
 * @param  {Response}   res the response object to send data back to the client
 * @param  {Function} next the restify handler to pass control to the next middleware in line
 */
module.exports = function(backend) {
  return function(req, res, next) {
    var params = req.params
    var errors = validateParameters(req)
    if (errors) {
      var outputError = new restify.MissingParameterError("change password failed")
      outputError.body.errors = errors
      return res.send(outputError)
    }
    backend.changePassword(params, function (err, user) {
      if (err) {
        var msg = err.message
        var outputError = new restify.InternalError(msg)
        return next(outputError)
      }
      res.send(200, user)
    })

  }
}


/**
 * validateParameters
 * @param  {Object} params the posted form data which must contain
 *   oldPassword
 *   newPassword
 * @return {Object} null if the parameters are valid, an error object if they are not
 */
function validateParameters(req) {
  req.assert('currentPassword', 'required').notEmpty()
  req.assert('email', 'required').isEmail()
  req.assert('newPassword', 'new password must be at least 4 characters long').len(4)
  var errors = req.validationErrors()
  return errors
}

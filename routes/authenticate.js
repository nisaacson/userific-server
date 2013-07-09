var restify = require('restify')
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
      var outputError = new restify.MissingParameterError("authenticate failed")
      outputError.body.errors = errors
      outputError.body.reason = 'missing_parameter'
      return res.send(outputError)
    }
    backend.authenticate(params, function (err, user) {
      var outputError

      if (err && err.reason === 'unconfirmed') {
        outputError = new restify.NotAuthorizedError('authenticate failed')
        outputError.body.reason = 'unconfirmed'
        return res.send(outputError)
      }
      if (err) {
        var msg = err.message
        outputError = new restify.InternalError(msg)
        return next(outputError)
      }
      if (user) {
        delete user.password
        res.send(200, user)
        return
      }
      res.send(new restify.InvalidCredentialsError('user not found'))
    })

  }
}


/**
 * validateParameters
 * @param  {Object} params the posted form data
 * @return {Object} null if the parameters are valid, an error object if they are not
 */
function validateParameters(req) {
  req.assert('email', 'required').isEmail()
  req.assert('password', 'password must be at least 4 characters long').len(4)
  var errors = req.validationErrors()
  return errors
}

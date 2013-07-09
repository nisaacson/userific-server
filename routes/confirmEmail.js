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
      var outputError = new restify.MissingParameterError("confirm email failed")
      outputError.body.errors = errors
      return res.send(outputError)
    }
    backend.confirmEmail.call(backend, params, function (err, user) {
      if (err) {
        var msg = err.message
        var outputError = new restify.InternalError(msg)
        return next(outputError)
      }
      if (user) {
        delete user.password
        res.send(200, user)
        return
      }
      res.send(new restify.InvalidCredentialsError('confirm token not found'))
    })

  }
}


/**
 * validateParameters
 * @param  {Object} params the posted form data
 * @return {Object} null if the parameters are valid, an error object if they are not
 */
function validateParameters(req) {
  req.assert('confirmToken', 'required').notNull()
  var errors = req.validationErrors()
  return errors
}

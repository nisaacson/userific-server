var restify = require('restify')
/**
 * Register new user route. This route should be called via POST request
 * @param  {Request}   req  the request object. Note that all user data is
 *   contained in the req.params object
 * @param  {Response}   res the response object to send data back to the client
 * @param  {Function} next the restify handler to pass control to the next middleware in line
 */
module.exports = function(backend, cb) {
  return function(req, res, next) {
    var params = req.params
    var errors = validateParameters(req)
    if (errors) {
      var outputError = new restify.MissingParameterError("Register failed")
      outputError.body.errors = errors
      return res.send(outputError)
    }
    backend.register(params, function (err, user) {
      if (err && err.reason) {
        outputError = new restify.InvalidArgumentError('register failed')
        outputError.body.reason = err.reason
        return next(outputError)
      }
      if (err) {
        var msg = err.message
        var outputError = new restify.InternalError(msg)
        if (err.reason) {
          outputError.body.reason = err.reason
        }
        return next(outputError)
      }
      cb(req, res, user)
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

var restify = require('restify')
/**
 * Register new user route. This route should be called via POST request
 * @param  {Request}   req  the request object. Note that all user data is
 *   contained in the req.params object
 * @param  {Response}   res the response object to send data back to the client
 * @param  {Function} next the restify handler to pass control to the next middleware in line
 */
module.exports = function (req, res, next) {
  var msg = 'Register not yet implemented'
  var err = new restify.InternalError(msg)
  return next(err)
}

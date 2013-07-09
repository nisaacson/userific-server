var restify = require('restify')
/**
 * grant a role to an existing user. This route should be called via POST request
 * @param  {Request}  req the request object. Note that all user data is
 *                    contained in the req.params object.
 *                    req.params should contain the following data
 *                    {
 *                      adminEmail: 'foo@example.com',
 *                      adminPassword: 'barPassword',
 *                      email: 'regularUser@example.com',
 *                      role: 'staff'
 *                    }
 *
 * @param  {Response}   res the response object to send data back to the client
 * @param  {Function} next the restify handler to pass control to the next middleware in line
 */
module.exports = function(backend) {
  return function(req, res, next) {
    var params = req.params
    validateParameters(req, function(err, adminUser) {
      if (err) return res.send(err)
      var email = params.email
      var role = params.role
      backend.grantRoleForEmail(role, email, function (err, reply) {
        var outputError
        if (err) {
          var msg = err.message
          outputError = new restify.InvalidArgumentError(msg)
          outputError.body.error = err.error
          if (err.reason) {
            outputError.body.reason = err.reason
          }
          return res.send(outputError)
        }
        var output = {
          role: role,
          email: email,
          message: 'role granted successfully'
        }
        res.send(201, output)
      })
    })
  }


  /**
   * validateParameters
   * @param  {Object} params the posted form data
   * @return {Object} null if the parameters are valid, an error object if they are not
   */

  function validateParameters(req, cb) {
    req.assert('adminEmail', 'required').isEmail()
    req.assert('adminPassword', 'required').notNull()
    req.assert('email', 'required').isEmail()
    req.assert('role', 'required').notNull()
    var errors = req.validationErrors()

    if (errors) {
      var outputError = new restify.MissingParameterError("authenticate failed")
      outputError.body.errors = errors
      outputError.body.reason = 'missing_parameter'
      return cb(outputError)
    }
    var params = req.params
    var authParams = {
      email: params.adminEmail,
      password: params.adminPassword
    }
    backend.authenticate(authParams, function(err, user) {
      var outputError
      if (err && err.reason === 'unconfirmed') {
        outputError = new restify.NotAuthorizedError('authenticate failed')
        outputError.body.reason = 'unconfirmed'
        return cb(outputError)
      }
      if (err) {
        var msg = err.message
        outputError = new restify.InternalError(msg)
        return cb(outputError)
      }
      if (!user) {
        outputError = new restify.InvalidCredentialsError('user not found')
        return cb(outputError)
      }
      backend.getRolesForEmail(authParams.email, function (err, roles) {
        if (err) {
          outputError = new restify.NotAuthorizedError('Failed to authenticate admin user')
          outputError.body.reason = 'not_authorized'
          return cb(outputError)
        }
        var isAdmin = roles.some(function(role) {
          return role === 'admin'
        })
        if (!isAdmin) {
          outputError = new restify.NotAuthorizedError('Failed to authenticate admin user')
          outputError.body.reason = 'not_authorized'
          return cb(outputError)
        }
        cb()
      })

    })
  }
}

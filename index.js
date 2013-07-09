var should = require('should')
var restify = require('restify')
var restifyValidator = require('restify-validator')
var register = require('./routes/register')
var authenticate = require('./routes/authenticate')
var confirmEmail = require('./routes/confirmEmail')
var changeEmail = require('./routes/changeEmail')
var changePassword = require('./routes/changePassword')
var resetPassword = require('./routes/resetPassword')
var grantRoleForEmail = require('./routes/grantRoleForEmail')
var generatePasswordResetToken = require('./routes/generatePasswordResetToken')
module.exports = function(backend, serverConfig, registerCallback, generatePasswordResetTokenCallback) {
  var server = restify.createServer(serverConfig)
  server.get('ping', function(req, res) {
    res.send({
      message: 'pong'
    })
  })

  // validate parameters
  should.exist(serverConfig, 'you must supply a serverConfig object as the second')
  should.exist(registerCallback, 'you must supply a callback for the register function as the third parameter')
  should.exist(generatePasswordResetTokenCallback, 'you must supply a callback for the generatePasswordResetToken function as the fourth parameter')


  server.use(restify.bodyParser())
  server.use(restify.queryParser())
  server.use(restifyValidator)
  server.post('/register', register(backend, registerCallback))
  server.post('/confirmEmail', confirmEmail(backend))
  server.post('/authenticate', authenticate(backend))
  server.post('/changeEmail', changeEmail(backend))
  server.post('/changePassword', changePassword(backend))
  server.post('/grantRoleForEmail', grantRoleForEmail(backend))
  server.post('/generatePasswordResetToken', generatePasswordResetToken(backend, generatePasswordResetTokenCallback))
  server.post('/resetPassword', resetPassword(backend))
  return server
}

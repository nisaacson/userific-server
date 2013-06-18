var restify = require('restify')
var restifyValidator = require('restify-validator')
var register = require('./routes/register')
var authenticate = require('./routes/authenticate')
var confirmEmail = require('./routes/confirmEmail')
var changeEmail = require('./routes/changeEmail')
var changePassword = require('./routes/changePassword')
var resetPassword = require('./routes/resetPassword')
var generatePasswordResetToken = require('./routes/generatePasswordResetToken')
module.exports = function(backend, serverConfig) {
  var server = restify.createServer(serverConfig)
  server.get('ping', function(req, res) {
    res.send({
      message: 'pong'
    })
  })
  server.use(restify.bodyParser())
  server.use(restify.queryParser())
  server.use(restifyValidator)
  server.post('/register', register(backend))
  server.post('/confirmEmail', confirmEmail(backend))
  server.post('/authenticate', authenticate(backend))
  server.post('/changeEmail', changeEmail(backend))
  server.post('/changePassword', changePassword(backend))
  server.post('/generatePasswordResetToken', generatePasswordResetToken(backend))
  server.post('/resetPassword', resetPassword(backend))
  return server
}

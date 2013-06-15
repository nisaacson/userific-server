var restify = require('restify')
var restifyValidator = require('restify-validator')
var register = require('./routes/register')
var authenticate = require('./routes/authenticate')
module.exports = function (backend, serverConfig) {
  var server = restify.createServer(serverConfig)
  server.get('ping', function (req, res) {
    res.send({message:'pong'})
  })
  server.use(restify.bodyParser())
  server.use(restify.queryParser())
  server.use(restifyValidator)
  server.post('/register', register(backend))
  server.post('/authenticate', authenticate(backend))
  return server
}

var restify = require('restify')
var restifyValidator = require('restify-validator')
var register = require('./routes/register')
module.exports = function (backend, serverConfig) {
  var server = restify.createServer(serverConfig)
  server.get('ping', function (req, res) {
    res.send({message:'pong'})
  })
  server.use(restify.bodyParser())
  server.use(restify.queryParser())
  server.use(restifyValidator)
  server.post('/register', register(backend))
  return server
}

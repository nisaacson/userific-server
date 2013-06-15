var restify = require('restify')
var register = require('./routes/register')
module.exports = function (backend, serverConfig) {
  var server = restify.createServer(serverConfig)
  server.get('ping', function (req, res) {
    res.send({message:'pong'})
  })
  server.post('/register', register)
  return server
}

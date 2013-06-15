var should = require('should')
var userificServer = require('../')
var inspect = require('eyespect').inspector()
var request = require('request')
describe('Setup', function() {
  it('should listen on a port correctly', function(done) {
    var backend = {}
    var serverConfig = {}
    var server = userificServer(backend, serverConfig)
    should.exist(server, 'server object not returned')
    server.listen(0)
    server.on('listening', function () {
      var port = server.address().port
      should.exist(port, 'server not listening on a port')
      var url = 'http://localhost:' + port + '/ping'
      request.get(url, function (err, res, body) {
        should.not.exist(err, 'error requesting ping route')
        var resData = JSON.parse(body)
        resData.message.should.eql('pong')
        done()
      })
    })
  });
});

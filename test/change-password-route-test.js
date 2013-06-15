var restify = require('restify')
var ce = require('cloneextend')
var should = require('should')
var userificServer = require('../')
var request = require('request')
describe('Change Password Route', function() {
  var port, server;
  var user = {
    username: 'fooUsername',
    email: 'foo@example.com',
    password: 'barPassword',
    _id: 'fooUserID'
  }
  var newPassword = 'fooPassword2'
  var backend = {
    changePassword: function(data, cb) {
      return cb(null, user)
    }
  }


  var opts = {
    method: 'post',
    json: true,
    form: {
      currentPassword: user.password,
      newPassword: newPassword
    }
  }
  before(function(done) {
    var serverConfig = {}
    server = userificServer(backend, serverConfig)
    should.exist(server, 'server object not returned')
    server.listen(0)
    server.on('listening', function() {
      port = server.address().port
      var url = 'http://localhost:' + port + '/changePassword'
      opts.url = url
      done()
    })
  })
  it('changePassword post route should be supported', function(done) {
    request(opts, function(err, res, body) {
      should.not.exist(err, 'error posting to changePassword route')
      var status = res.statusCode
      status.should.eql(201, 'incorrect status code')
      body.username.should.eql(user.username)
      done()
    })
  });
  it('changePassword post route should give MissingParameter error when currentPassword is not supplied', function(done) {
    var testOpts = ce.clone(opts);
    delete testOpts.form.currentPassword
    request(testOpts, function(err, res, body) {
      should.not.exist(err, 'error posting to changePassword route')
      var status = res.statusCode
      var desiredStatusCode = new restify.MissingParameterError().statusCode
      status.should.eql(desiredStatusCode, 'incorrect status code')
      body.errors.length.should.eql(1)
      body.errors[0].param.should.eql('currentPassword')
      done()
    })
  });

it('changePassword post route should give MissingParameter error when newPassword is not supplied', function(done) {
    var testOpts = ce.clone(opts);
    delete testOpts.form.newPassword
    request(testOpts, function(err, res, body) {
      should.not.exist(err, 'error posting to changePassword route')
      var status = res.statusCode
      var desiredStatusCode = new restify.MissingParameterError().statusCode
      status.should.eql(desiredStatusCode, 'incorrect status code')
      body.errors.length.should.eql(1)
      body.errors[0].param.should.eql('newPassword')
      done()
    })
  });

  it('changePassword post route should pass errors from backend', function(done) {
    var errorMessage = 'foo error'
    backend.changePassword = function(data, cb) {
      return cb({
        message: errorMessage,
        error: 'mock error here',
        stack: new Error().stack
      })
    }
    request(opts, function(err, res, body) {
      should.not.exist(err, 'error posting to changePassword route')
      var status = res.statusCode
      status.should.eql(500, 'incorrect status code')
      body.message.should.eql(errorMessage)
      done()
    })
  });
});

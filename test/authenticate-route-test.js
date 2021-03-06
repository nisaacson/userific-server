var restify = require('restify')
var ce = require('cloneextend')
var should = require('should')
var userificServer = require('../')
var request = require('request')
describe('Authenticate Route', function() {
  var port, server;
  var user = {
    username: 'fooUsername',
    email: 'foo@example.com',
    password: 'fooPassword',
    _id: 'fooUserID'
  }
  var backend = {
    authenticate: function(data, cb) {
      return cb(null, user)
    }
  }


  var opts = {
    method: 'post',
    json: true,
    form: {
      email: user.email,
      password: user.password
    }
  }
  before(function(done) {
    var serverConfig = {}
    var registerCallback = function(req, res, user) {
      console.log('mock register callback called')
    }
    var generatePasswordResetTokenCallback = function(req, res, user) {
      console.log('mock generatePasswordResetTokenCallback called')
    }
    server = userificServer(backend, serverConfig, registerCallback, generatePasswordResetTokenCallback)
    should.exist(server, 'server object not returned')
    server.listen(0)
    server.on('listening', function() {
      port = server.address().port
      var url = 'http://localhost:' + port + '/authenticate'
      opts.url = url
      done()
    })
  })
  it('authenticate post route should be supported', function(done) {
    request(opts, function(err, res, body) {
      should.not.exist(err, 'error posting to authenticate route')
      var status = res.statusCode
      status.should.eql(200, 'incorrect status code')
      body.username.should.eql(user.username)
      done()
    })
  });
  it('authenticate post route should give MissingParameter error when email is not supplied', function(done) {
    var testOpts = ce.clone(opts);
    delete testOpts.form.email
    request(testOpts, function(err, res, body) {
      should.not.exist(err, 'error posting to authenticate route')
      var status = res.statusCode
      var desiredStatusCode = new restify.MissingParameterError().statusCode
      status.should.eql(desiredStatusCode, 'incorrect status code')
      body.errors.length.should.eql(1)
      body.errors[0].param.should.eql('email')
      body.reason.should.eql('missing_parameter')
      done()
    })
  });

it('authenticate post route should give MissingParameter error when password is not supplied', function(done) {
    var testOpts = ce.clone(opts);
    delete testOpts.form.password
    request(testOpts, function(err, res, body) {
      should.not.exist(err, 'error posting to authenticate route')
      var status = res.statusCode
      var desiredStatusCode = 409
      status.should.eql(desiredStatusCode, 'incorrect status code')
      body.errors.length.should.eql(1)
      body.errors[0].param.should.eql('password')
      body.reason.should.eql('missing_parameter')
      done()
    })
  });

  it('authenticate post route should pass errors from backend', function(done) {
    var errorMessage = 'foo error'
    backend.authenticate = function(data, cb) {
      return cb({
        message: errorMessage,
        error: 'mock error here',
        stack: new Error().stack
      })
    }
    request(opts, function(err, res, body) {
      should.not.exist(err, 'error posting to authenticate route')
      var status = res.statusCode
      status.should.eql(500, 'incorrect status code')
      body.message.should.eql(errorMessage)
      done()
    })
  });
});

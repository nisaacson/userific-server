var inspect = require('eyespect').inspector()
var restify = require('restify')
var ce = require('cloneextend')
var should = require('should')
var userificServer = require('../')
var request = require('request')
describe('Register Route', function() {
  var port, server;
  var user = {
    username: 'fooUsername',
    email: 'foo@example.com',
    password: 'fooPassword',
    _id: 'fooUserID'
  }
  var backend = {
    register: function(data, cb) {
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
    server = userificServer(backend, serverConfig)
    should.exist(server, 'server object not returned')
    server.listen(0)
    server.on('listening', function() {
      port = server.address().port
      var url = 'http://localhost:' + port + '/register'
      opts.url = url
      done()
    })
  })
  it('register post route should be supported', function(done) {
    request(opts, function(err, res, body) {
      should.not.exist(err, 'error posting to register route')
      var status = res.statusCode
      status.should.eql(201, 'incorrect status code')
      body.username.should.eql(user.username)
      done()
    })
  });
  it('register post route should give MissingParameter error when email is not supplied', function(done) {
    var testOpts = ce.clone(opts);
    delete testOpts.form.email
    request(testOpts, function(err, res, body) {
      should.not.exist(err, 'error posting to register route')
      var status = res.statusCode
      var desiredStatusCode = 409
      status.should.eql(desiredStatusCode, 'incorrect status code')
      body.errors.length.should.eql(1)
      body.errors[0].param.should.eql('email')
      done()
    })
  });

it('register post route should give MissingParameter error when password is not supplied', function(done) {
    var testOpts = ce.clone(opts);
    delete testOpts.form.password
    request(testOpts, function(err, res, body) {
      should.not.exist(err, 'error posting to register route')
      var status = res.statusCode
      var desiredStatusCode = 409
      inspect(body,'register body')
      status.should.eql(desiredStatusCode, 'incorrect status code')
      body.errors.length.should.eql(1)
      body.errors[0].param.should.eql('password')
      done()
    })
  });

  it('register post route should pass errors from backend', function(done) {
    var errorMessage = 'foo error'
    backend.register = function(data, cb) {
      return cb({
        message: errorMessage,
        error: 'mock error here',
        stack: new Error().stack
      })
    }
    request(opts, function(err, res, body) {
      should.not.exist(err, 'error posting to register route')
      var status = res.statusCode
      status.should.eql(500, 'incorrect status code')
      body.message.should.eql(errorMessage)
      done()
    })
  });
});

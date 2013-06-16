var path = require('path')
var configFilePath = path.join(__dirname, 'mongo.json')
var config = require('nconf').file({
  file: configFilePath
})
var mongo = config.get('mongo')
var mongoose = require('mongoose');
var UserificMongoose = require('userific-mongoose')
var restify = require('restify')
var ce = require('cloneextend')
var should = require('should')
var userificServer = require('../../')
var request = require('request')
var User
describe('Test Register Route with live mongoose backend', function() {
  var baseURL, port, server, user, registerOpts
  this.timeout('50s')
  user = {
    username: 'fooUsername',
    email: 'foo@example.com',
    password: 'fooPassword',
    _id: 'fooUserID'
  }
  registerOpts = {
    method: 'post',
    json: true,
    form: {
      email: user.email,
      password: user.password
    }
  }

  before(function(done) {
    var backend, serverConfig
    backend = new UserificMongoose(mongo)
    User = backend.User
    serverConfig = {}
    server = userificServer(backend, serverConfig)
    should.exist(server, 'server object not returned')
    server.listen(0)
    server.on('listening', function() {
      port = server.address().port
      baseURL = 'http://localhost:' + port
      registerOpts.url = baseURL + '/register'
      done()
    })
  })
  beforeEach(function(done) {
    User.collection.drop(function(err) {
      if (err && err.message != 'ns not found') done(err)
      done(null)
    })
  })

  it('register post route should be supported', function(done) {
    request(registerOpts, function(err, res, body) {
      should.not.exist(err, 'error posting to register route')
      var status = res.statusCode
      status.should.eql(201, 'incorrect status code')
      body.email.should.eql(user.email)
      done()
    })
  });

  it('authenticate post route should be supported', function(done) {
    request(registerOpts, function(err, res, body) {
      should.not.exist(err, 'error posting to register route')
      var status = res.statusCode
      status.should.eql(201, 'incorrect status code')
      body.email.should.eql(user.email)
      var authenticateOpts = {
        url: baseURL + '/authenticate',
        method: 'post',
        form: {
          email: user.email,
          password: user.password
        },
        json: true
      }
      request(authenticateOpts, function (err, res, body) {
        should.not.exist(err, 'error posting to authenticate route')
        res.statusCode.should.eql(200)
        body.email.should.eql(authenticateOpts.form.email)
        done()
      })
    })
  });

});

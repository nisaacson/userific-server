var path = require('path')
var inspect = require('eyespect').inspector()
var configFilePath = path.join(__dirname, 'postgres.json')
var config = require('nconf').file({
  file: configFilePath
})
var postgresConfig = config.get('postgres')
var UserificPostGRES = require('userific-postgres')
var restify = require('restify')
var ce = require('cloneextend')
var should = require('should')
var userificServer = require('../../')
var request = require('request')
describe('PostGRE backend routes', function() {
  var baseURL, port, server, user, client, registerOpts
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
      backend = new UserificPostGRES(postgresConfig)
      serverConfig = {}
    server = userificServer(backend, serverConfig)
    should.exist(server, 'server object not returned')
    server.listen(0)
    server.on('listening', function() {
      port = server.address().port
      baseURL = 'http://localhost:' + port
      registerOpts.url = baseURL + '/register'
      backend.init(function(err, reply) {
        if (err) {
          inspect(err, 'error setting up postgres backend')
        }
        should.not.exist(err, 'error setting up postgres backend')
        should.exist(reply, 'no client returned from init method')
        client = reply
        done()
      })
    })
  })
  beforeEach(function(done) {
    var query = 'DELETE FROM ' + postgresConfig.table
    client.query(query, done)
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

  it('confirmEmail post route should be supported', function(done) {
    request(registerOpts, function(err, res, body) {
      should.not.exist(err, 'error posting to register route')
      var status = res.statusCode
      status.should.eql(201, 'incorrect status code')
      body.email.should.eql(user.email)
      var confirmToken = body.confirmToken
      should.exist(confirmToken, 'confirmToken not set in register response body')
      var confirmOpts = {
        url: baseURL + '/confirmEmail',
        method: 'post',
        form: {
          confirmToken: confirmToken
        },
        json: true
      }
      request(confirmOpts, function(err, res, body) {
        should.not.exist(err)
        should.exist(body)
        body.confirmed.should.eql(true, 'confirmed should be true')
        res.statusCode.should.eql(200)
        done()
      })
    })
  });

  it('authenticate post route should be supported', function(done) {
    request(registerOpts, function(err, res, body) {
      should.not.exist(err, 'error posting to register route')
      var status = res.statusCode
      status.should.eql(201, 'incorrect status code')
      body.email.should.eql(user.email)
      var confirmToken = body.confirmToken
      should.exist(confirmToken, 'confirmToken not set in register response body')
      var confirmOpts = {
        url: baseURL + '/confirmEmail',
        method: 'post',
        form: {
          confirmToken: confirmToken
        },
        json: true
      }
      request(confirmOpts, function(err, res, body) {
        should.not.exist(err)
        should.exist(body)
        body.confirmed.should.eql(true, 'confirmed should be true')
        res.statusCode.should.eql(200)
        var authenticateOpts = {
          url: baseURL + '/authenticate',
          method: 'post',
          form: {
            email: user.email,
            password: user.password
          },
          json: true
        }
        request(authenticateOpts, function(err, res, body) {
          should.not.exist(err, 'error posting to authenticate route')
          res.statusCode.should.eql(200)
          body.email.should.eql(authenticateOpts.form.email)
          done()
        })
      })
    })
  });

  it('authenticate post route should return 401 status code when user is not found', function(done) {
    var authenticateOpts = {
      url: baseURL + '/authenticate',
      method: 'post',
      form: {
        email: user.email,
        password: user.password
      },
      json: true
    }
    request(authenticateOpts, function(err, res, body) {
      should.not.exist(err, 'error posting to authenticate route')
      res.statusCode.should.eql(401)
      body.code.should.eql('InvalidCredentials')
      done()
    })
  });

  it('authenticate post route should return 403 status code when user is found but not confirmed', function(done) {
    request(registerOpts, function(err, res, body) {
      should.not.exist(err, 'error posting to register route')
      var status = res.statusCode
      status.should.eql(201, 'incorrect status code')
      body.email.should.eql(user.email)
      var confirmToken = body.confirmToken
      should.exist(confirmToken, 'confirmToken not set in register response body')
      var authenticateOpts = {
        url: baseURL + '/authenticate',
        method: 'post',
        form: {
          email: user.email,
          password: user.password
        },
        json: true
      }
      request(authenticateOpts, function(err, res, body) {
        should.not.exist(err, 'error posting to authenticate route')
        res.statusCode.should.eql(403)
        body.reason.should.eql('unconfirmed')
        body.code.should.eql('NotAuthorized')
        done()
      })
    })
  })

  it('changeEmail post route should be supported', function(done) {
    request(registerOpts, function(err, res, body) {
      should.not.exist(err, 'error posting to register route')
      var status = res.statusCode
      status.should.eql(201, 'incorrect status code')
      body.email.should.eql(user.email)
      var confirmToken = body.confirmToken
      should.exist(confirmToken, 'confirmToken not set in register response body')
      var confirmOpts = {
        url: baseURL + '/confirmEmail',
        method: 'post',
        form: {
          confirmToken: confirmToken
        },
        json: true
      }
      request(confirmOpts, function(err, res, body) {
        should.not.exist(err)
        should.exist(body)
        body.confirmed.should.eql(true, 'confirmed should be true')
        res.statusCode.should.eql(200)
        var newEmail = 'newEmail2@example.com'
        var changeEmailOpts = {
          url: baseURL + '/changeEmail',
          method: 'post',
          form: {
            currentEmail: user.email,
            newEmail: newEmail,
            password: user.password
          },
          json: true
        }

        request(changeEmailOpts, function(err, res, body) {
          should.not.exist(err, 'error posting to authenticate route')
          res.statusCode.should.eql(200)
          body.email.should.eql(changeEmailOpts.form.newEmail)
          done()
        })
      })
    })
  })

  it('generatePasswordResetToken post route should be supported', function(done) {
    request(registerOpts, function(err, res, body) {
      should.not.exist(err, 'error posting to register route')
      var status = res.statusCode
      status.should.eql(201, 'incorrect status code')
      body.email.should.eql(user.email)
      var confirmToken = body.confirmToken
      should.exist(confirmToken, 'confirmToken not set in register response body')
      var confirmOpts = {
        url: baseURL + '/confirmEmail',
        method: 'post',
        form: {
          confirmToken: confirmToken
        },
        json: true
      }
      request(confirmOpts, function(err, res, body) {
        should.not.exist(err)
        should.exist(body)
        body.confirmed.should.eql(true, 'confirmed should be true')
        res.statusCode.should.eql(200)
        var newEmail = 'newEmail2@example.com'
        var generatePasswordResetTokenOpts = {
          url: baseURL + '/generatePasswordResetToken',
          method: 'post',
          form: {
            email: user.email
          },
          json: true
        }

        request(generatePasswordResetTokenOpts, function(err, res, body) {
          should.not.exist(err, 'error posting to generatePasswordResetToken route')
          res.statusCode.should.eql(200)
          should.exist(body.resetToken, 'resetToken field missing from body')
          done()
        })
      })
    })
  })

  it('resetPassword post route should be supported', function(done) {
    request(registerOpts, function(err, res, body) {
      should.not.exist(err, 'error posting to register route')
      var status = res.statusCode
      status.should.eql(201, 'incorrect status code')
      body.email.should.eql(user.email)
      var confirmToken = body.confirmToken
      should.exist(confirmToken, 'confirmToken not set in register response body')
      var confirmOpts = {
        url: baseURL + '/confirmEmail',
        method: 'post',
        form: {
          confirmToken: confirmToken
        },
        json: true
      }
      request(confirmOpts, function(err, res, body) {
        should.not.exist(err)
        should.exist(body)
        body.confirmed.should.eql(true, 'confirmed should be true')
        res.statusCode.should.eql(200)
        var generatePasswordResetTokenOpts = {
          url: baseURL + '/generatePasswordResetToken',
          method: 'post',
          form: {
            email: user.email
          },
          json: true
        }

        request(generatePasswordResetTokenOpts, function(err, res, body) {
          should.not.exist(err, 'error posting to generatePasswordResetToken route')
          res.statusCode.should.eql(200)
          should.exist(body.resetToken, 'resetToken field missing from body')
          var resetToken = body.resetToken
          var resetPasswordOpts = {
            url: baseURL + '/resetPassword',
            method: 'post',
            form: {
              email: user.email,
              resetToken: resetToken
            },
            json: true
          }
          request(resetPasswordOpts, function(err, res, body) {
            should.not.exist(err, 'error posting to resetPassword route')
            res.statusCode.should.eql(200)
            should.exist(body.password)
            var newPassword = body.password
            var authenticateOpts = {
              method: 'post',
              form: {
                email: user.email,
                password: newPassword
              },
              json: true,
              url: baseURL + '/authenticate'
            }
            request(authenticateOpts, function(err, res, body) {
              should.not.exist(err)
              res.statusCode.should.eql(200)
              body.email.should.eql(user.email)
              done()
            })
          })
        })
      })
    })
  })

  it('changePassword post route should be supported', function(done) {
    request(registerOpts, function(err, res, body) {
      should.not.exist(err, 'error posting to register route')
      var status = res.statusCode
      status.should.eql(201, 'incorrect status code')
      body.email.should.eql(user.email)
      var confirmToken = body.confirmToken
      should.exist(confirmToken, 'confirmToken not set in register response body')
      var confirmOpts = {
        url: baseURL + '/confirmEmail',
        method: 'post',
        form: {
          confirmToken: confirmToken
        },
        json: true
      }
      request(confirmOpts, function(err, res, body) {
        should.not.exist(err)
        should.exist(body)
        body.confirmed.should.eql(true, 'confirmed should be true')
        res.statusCode.should.eql(200)
        var newPassword = 'newBarPassword2'
        var changePasswordOpts = {
          url: baseURL + '/changePassword',
          method: 'post',
          form: {
            email: user.email,
            currentPassword: user.password,
            newPassword: newPassword
          },
          json: true
        }
        request(changePasswordOpts, function(err, res, body) {
          should.not.exist(err, 'error posting to authenticate route')
          res.statusCode.should.eql(200)
          var authenticateOpts = {
            method: 'post',
            form: {
              email: user.email,
              password: newPassword
            },
            json: true,
            url: baseURL + '/authenticate'
          }
          request(authenticateOpts, function(err, res, body) {
            should.not.exist(err)
            res.statusCode.should.eql(200)
            body.email.should.eql(user.email)
            done()
          })
        })
      })
    })
  })
})

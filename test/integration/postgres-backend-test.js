var uuid = require('uuid')
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
var backend
var registeredUserEmail = 'buzz@example.com'

describe('PostGRE backend routes', function() {
  this.timeout('10s')
  var baseURL, port, server, user, client, registerOpts
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
    var serverConfig
    var registerCallback = function(req, res, user) {
      user.fakeConfirmToken = user.confirmToken;
      delete user.confirmToken
      res.send(201, user)
    }
    var generatePasswordResetTokenCallback = function(req, res, user) {
      user.fakeResetToken = user.resetToken;
      delete user.resetToken
      res.send(200, user)
    }
    backend = new UserificPostGRES(postgresConfig)
    serverConfig = {}
    server = userificServer(backend, serverConfig, registerCallback, generatePasswordResetTokenCallback)
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
    var query = 'DELETE FROM users'
    client.query(query, function(err) {
      should.not.exist(err)
      var query = 'DELETE FROM access_tokens'
      client.query(query, function(err) {
        should.not.exist(err)
        var userID = uuid.v4()
        var hash = 'fooPasswordHash'
        var email = registeredUserEmail
        client.query('INSERT INTO users (id, email, password, confirmed) VALUES ($1, $2, $3, $4)', [userID, email, hash, false], done)
      })
    })
  })

  it('register post route should be supported', function(done) {
    testRegister(baseURL, user, done)
  })
  it('register post route should be give error when registering duplicate email', function(done) {
    testRegister(baseURL, user, function(err, body) {
      var opts = {
        url: baseURL + '/register',
        method: 'post',
        form: {
          email: user.email,
          password: user.password
        },
        json: true
      }
      request(opts, function(err, res, body) {
        should.not.exist(err, 'error registering user')
        body.reason.should.eql('email_taken')
        res.statusCode.should.eql(409)
        body.code.should.eql('InvalidArgument')
        done()
      })
    })
  })

  it('confirmEmail get route should be supported', function(done) {
    testRegister(baseURL, user, function(err, body) {
      getConfirmTokenForEmail(client, user.email, function(err, confirmToken) {
        testConfirmEmail(baseURL, confirmToken, done)
      })
    })
  })

  it('authenticate post route should be supported', function(done) {
    testRegister(baseURL, user, function(err, body) {
      getConfirmTokenForEmail(client, user.email, function(err, confirmToken) {
        testConfirmEmail(baseURL, confirmToken, function(err, body) {
          testAuthenticate(baseURL, user, done)
        })
      })
    })
  })

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
    testRegister(baseURL, user, function(err, body) {
      var confirmToken = body.fakeConfirmToken
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
    testRegister(baseURL, user, function(err, body) {
      getConfirmTokenForEmail(client, user.email, function(err, confirmToken) {
        testConfirmEmail(baseURL, confirmToken, function(err, body) {
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
  })

  it('generatePasswordResetToken post route should be supported', function(done) {
    testRegister(baseURL, user, function(err, body) {
      getConfirmTokenForEmail(client, user.email, function(err, confirmToken) {
        testConfirmEmail(baseURL, confirmToken, function(err, body) {
          testGeneratePasswordResetToken(baseURL, user, done)
        })
      })
    })
  })

  it('resetPassword post route should be supported', function(done) {
    testRegister(baseURL, user, function(err, body) {
      getConfirmTokenForEmail(client, user.email, function(err, confirmToken) {
        testConfirmEmail(baseURL, confirmToken, function(err, body) {
          testGeneratePasswordResetToken(baseURL, user, function(err, resetToken) {
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
              var authData = {
                email: user.email,
                password: newPassword
              }
              testAuthenticate(baseURL, authData, done)
            })
          })
        })
      })
    })
  })

  it('resetPassword post route should give error when invalid token is used', function(done) {
    testRegister(baseURL, user, function(err, body) {
      getConfirmTokenForEmail(client, user.email, function(err, confirmToken) {
        testConfirmEmail(baseURL, confirmToken, function(err, body) {
          testGeneratePasswordResetToken(baseURL, user, function(err, resetToken) {
            var fakeResetToken = 'fake reset token here'
            fakeResetToken.should.not.eql(resetToken)
            var resetPasswordOpts = {
              url: baseURL + '/resetPassword',
              method: 'post',
              form: {
                email: user.email,
                resetToken: fakeResetToken
              },
              json: true
            }
            request(resetPasswordOpts, function(err, res, body) {
              should.not.exist(err, 'error posting to resetPassword route')
              if (res.statusCode !== 401) {
                inspect(body, 'invalid reset body')
              }
              res.statusCode.should.eql(401)
              body.code.should.eql('InvalidCredentials')
              should.not.exist(body.password)
              // user should still be able to authenticate with old password
              var authData = {
                email: user.email,
                password: user.password
              }
              testAuthenticate(baseURL, authData, done)
            })
          })
        })
      })
    })
  })

  it('changePassword post route should be supported', function(done) {
    testRegister(baseURL, user, function(err, body) {
      getConfirmTokenForEmail(client, user.email, function(err, confirmToken) {
        testConfirmEmail(baseURL, confirmToken, function(err, body) {
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
            var authData = {
              email: user.email,
              password: newPassword
            }
            testAuthenticate(baseURL, authData, done)
          })
        })
      })
    })
  })
});



function getConfirmTokenForEmail(client, email, cb) {
  var query = 'SELECT confirm_token from users where email = $1'
  client.query(query, [email], function(err, reply) {
    should.not.exist(err, 'error getting confirm code')
    var rows = reply.rows
    rows.length.should.eql(1)
    var record = rows[0]
    var confirmToken = record.confirm_token
    should.exist(confirmToken, 'confirmToken not found')
    return cb(null, confirmToken)
  })
}

function testRegister(baseURL, user, cb) {
  saveAccessTokenForEmail(registeredUserEmail, function(err, accessToken) {
    if (err) {
      return cb(err)
    }
    var opts = {
      url: baseURL + '/register',
      method: 'post',
      form: {
        email: user.email,
        password: user.password,
        accessToken: accessToken
      },
      json: true
    }
    request(opts, function(err, res, body) {
      should.not.exist(err, 'error registering user')
      if (res.statusCode !== 201) {
        inspect(body, 'invalid register body')
      }
      res.statusCode.should.eql(201, 'wrong status code after registering user')
      body.email.should.eql(user.email, 'incorrect email in register body')
      cb(null, body)
    })
  })
}

function saveAccessTokenForEmail(email, cb) {
  var accessToken = uuid.v4()
  backend.saveAccessTokenForEmail(email, accessToken, function(err, reply) {
    should.not.exist(err)
    backend.getAccessTokensForEmail(email, function(err, tokens) {
      should.not.exist(err)
      tokens.length.should.eql(1)
      cb(null, accessToken)
    })
  })
}

function testAuthenticate(baseURL, user, cb) {
  var opts = {
    url: baseURL + '/authenticate',
    method: 'post',
    form: user,
    json: true
  }
  request(opts, function(err, res, body) {
    should.not.exist(err, 'error confirming email')
    res.statusCode.should.eql(200, 'wrong status code after confirming user')
    cb(null, body)
  })
}


function testConfirmEmail(baseURL, confirmToken, cb) {
  var opts = {
    url: baseURL + '/confirmEmail',
    method: 'post',
    form: {
      confirmToken: confirmToken
    },
    json: true
  }
  request(opts, function(err, res, body) {
    should.not.exist(err, 'error confirming email')
    body.confirmed.should.eql(true, 'body.confirmed should be true')
    res.statusCode.should.eql(200, 'wrong status code after confirming user')
    cb(null, body)
  })
}

function testGeneratePasswordResetToken(baseURL, user, cb) {
  var opts = {
    url: baseURL + '/generatePasswordResetToken',
    method: 'post',
    form: {
      email: user.email
    },
    json: true
  }
  request(opts, function(err, res, body) {
    should.not.exist(err, 'error generating password reset token')
    res.statusCode.should.eql(200, 'wrong status code after generating reset token')
    var resetToken = body.fakeResetToken
    should.exist(resetToken, 'resetToken')
    cb(null, resetToken)
  })
}

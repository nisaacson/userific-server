# Userfic Server
[![Build Status](https://travis-ci.org/nisaacson/userific-server.png)](https://travis-ci.org/nisaacson/userific-server)

A restful api server to manage users in your application. The server can be used with any userfic backends.

# Installation

```bash
npm install -S userific-server
```

# Setup
To setup the server you need to supply a properly configured userific backend. When creating the server you need to supply your own callbacks to the `register` and `generatePasswordResetToken`. Both of these functions generate secret tokens which are used to confirm the user by their email address. The userific api server is intended to be a public-facing api so the tokens cannot be passed back directly to the user. Each callback will be passed the `req` (request),`res` (response) and the data provided by the backend after the work is complete

```javascript
var userificServer = require('userific-server')
var mongooseBackend = require('userific-mongoose')
var config = {
    database: 'fooDatabase',
    username: 'fooUsername',
    password: 'fooPassword'
}

// instatiate a mongoose userific backend which stores user data in a MongoDB database
var backend = mongooseBackend(config)


/**
 * registerCallback
 * @param  {Stream} req  the incoming request from the client
 * @param  {Stream} res  the response stream used to send data  back to the client
 * @param  {Object} user the user data provided by the backend after the registration process is complete.
 *  the user ojbect contains the fields
 *   {
 *      email: "foo@example.com",
 *      _id: 'id of user in backend data-store',
 *     confirmToken: 'the token to email to the user so that they can confirm your account
 *   }
 */
var registerCallback = function(req, res, user) {
  var email = user.email
  var confirmToken = user.confirmToken
  // email the confirm token to the user now
  var confirmEmailLink = 'http://localhost:3000/confirmEmail?confirmToken=' + confirmToken
  var emailBody = 'Thanks for registering a new account. Please click on the link below to confirm your email address and finish the registration process\n' + confirmEmailLink
  // send email here
  mailer.send(email, emailBody, function(err) {
    var outputError
    if (err) {
      outputError = new restify.InternalError('register completed correctly but failed to send)
      outputError.body.error = err
      outputError.body.reason = 'send_email_failed'
      res.send(outputError)
      return
    }

    // never send the confirmToken directly to the user
    delete user.confirmToken
    res.send(user)
  })
}

/**
 * generatePasswordResetTokenCallback
 * @param  {Stream} req  the incoming request from the client
 * @param  {Stream} res  the response stream used to send data  back to the client
 * @param  {Object} user the user data provided by the backend after the registration process is complete.
 *  the user ojbect contains the fields
 *   {
 *      email: "foo@example.com",
 *      _id: 'id of user in backend data-store',
 *     confirmToken: 'the token to email to the user so that they can confirm your account
 *   }
 */
var generatePasswordResetTokenCallback = function(req, res, user) {
  var email = user.email
  var resetToken = user.resetToken
  // email the confirm token to the user now
  var resetLink = 'http://localhost:3000/resetPassword?resetToken=' + resetToken
  var emailBody = 'You have requested to reset your password. Please click on the link below to reset your password\n' + resetLink
  // send email here
  mailer.send(email, emailBody, function(err) {
    var outputError
    if (err) {
      outputError = new restify.InternalError('generatePasswordResetToken completed correctly but failed to send email to user with reset link)
      outputError.body.error = err
      outputError.body.reason = 'send_email_failed'
      res.send(outputError)
      return
    }

    // never send the resetToken directly to the user
    delete user.resetToken
    res.send(user)
  })
}

// pass the backend in as a parameter. Note that server here is an instance of restify.createServer
var server = userificServer(backend, serverConfig, registerCallback, generatePasswordResetTokenCallback)
// start the server on port 3000
var port = 3000
server.listen(3000)

```


When creating the server in the example above, `serverConfig` is the configuration object that is passed to `restify.createServer`. [Restify Documentation](http://mcavage.github.io/node-restify/#Creating-a-Server). For example if you wish to create an https server, pass the certificate and key objects

```javascript
var userificServer = require('userific-server')
var backend = {} //some instatiated userific backend
var serverConfig = {
    certificate: 'PEM-encoded certificate string here',
    key: 'PEM-encoded key string here'
}

var server = userificServer(backend, serverConfig)
```


# Routes
For example say the server is listening on `host: localhost`, `port: 3000` and is configured to use `https`. Once the server is setup and listening on port 3000 the following routes are available.

* `https://localhost:3000/register`
* `https://localhost:3000/confirmEmail`
* `https://localhost:3000/authenticate`
* `https://localhost:3000/changeEmail`
* `https://localhost:3000/changePassword`
* `https://localhost:3000/resetPassword`

For more information on the server api, consult the [apiary.io documentation here](http://docs.userificserver.apiary.io/)


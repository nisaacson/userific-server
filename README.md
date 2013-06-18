# Userfic Server
[![Build Status](https://travis-ci.org/nisaacson/userific-server.png)](https://travis-ci.org/nisaacson/userific-server)

A restful api server to manage users in your application. The server can be used with any userfic backends.

# Installation

```bash
npm install -S userific-server
```

# Setup
To setup the server you need to supply a properly configured userific backend

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

// pass the backend in as a parameter. Note that server here is an instance of restify.createServer
var server = userificServer(backend, serverConfig)
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


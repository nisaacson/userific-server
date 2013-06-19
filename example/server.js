/**
 * Example Userific Server with a postgres backend.
 *
 * You might need to install the development dependecies to run this server.
 * You can install the development dependencies by going to the project root and executing
 *  "npm install"
 *
 * Note that you will a need a postgres server running with a users table setup.
 *
 * For configuration options see config.json in this directory. The settings you might
 * need to configure are in the "postgres" section of this file
 *
 * @type {[type]}
 */


// make the server listen on port 3000
var port = 3000
var inspect = require('eyespect').inspector()
var UserificPostGRES = require('userific-postgres')
var assert = require('assert')
var fs = require('fs')
var argv = require('optimist').usage('$0 --config ./config.json').demand('config').argv
var configFilePath = argv.config
assert.ok(fs.existsSync(configFilePath), 'config file not found at path: ' + configFilePath)
var config = require('nconf').file({
  file: configFilePath
})
var postgresConfig = config.get('postgres')
var backend = new UserificPostGRES(postgresConfig)
var userificServer = require('../')
var serverConfig = {}

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
var server = userificServer(backend, serverConfig, registerCallback, generatePasswordResetTokenCallback)
server.listen(port, function () {
  inspect(port, 'userific example server listening on port')
  console.log('open your web browser to http://localhost:' + port + '/ping\nto make sure the server is running correctly')
})

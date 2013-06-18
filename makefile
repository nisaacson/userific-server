MOCHA=node_modules/.bin/mocha
REPORTER?=tap
FLAGS=--reporter $(REPORTER)

test: unit integration

unit:
	$(MOCHA) $(shell find test/* -prune -name "*test.js") $(FLAGS)
setup:
	$(MOCHA) test/setup-test.js $(FLAGS)
register-route:
	$(MOCHA) test/register-route-test.js $(FLAGS)
authenticate-route:
	$(MOCHA) test/authenticate-route-test.js $(FLAGS)
change-email-route:
	$(MOCHA) test/change-email-route-test.js $(FLAGS)
change-password-route:
	$(MOCHA) test/change-password-route-test.js $(FLAGS)


integration:
	$(MOCHA) $(shell find test/integration/* -prune -name "*test.js") $(FLAGS)
mongoose-backend:
	$(MOCHA) test/integration/mongoose-backend-test.js $(FLAGS)
postgres-backend:
	$(MOCHA) test/integration/postgres-backend-test.js $(FLAGS)

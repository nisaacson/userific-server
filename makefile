MOCHA=node_modules/.bin/mocha
REPORTER?=tap
FLAGS=--reporter $(REPORTER)

test: unit

unit:
	$(MOCHA) $(shell find test/* -prune -name "*test.js") $(FLAGS)
setup:
	$(MOCHA) test/setup-test.js $(FLAGS)
register-route:
	$(MOCHA) test/register-route-test.js $(FLAGS)

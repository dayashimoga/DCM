.PHONY: all test lint build validate certify production-certify clean

all: production-certify

test:
	sh scripts/run-node-tests.sh

test-agent:
	cd apps/provider-agent && sh ../../scripts/run-python-tests.sh

validate:
	sh scripts/validate-production.sh

certify: validate

production-certify:
	sh scripts/validate-production.sh

clean:
	rm -rf dist apps/api/dist apps/web/out packages/*/dist

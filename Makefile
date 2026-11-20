PNPM ?= pnpm
API := apps/api
WEB := apps/web
E2E := apps/e2e

.DEFAULT_GOAL := help
.PHONY: help install dev dev-api dev-web test test-api test-web lint lint-api lint-web lint-e2e e2e \
        build build-api build-web docs-budget check up down mail

help: ## List the targets
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*## "} {printf "  %-12s %s\n", $$1, $$2}'

install: ## Download the API modules and the frontend and e2e dependencies
	cd $(API) && go mod download
	cd $(WEB) && $(PNPM) install --frozen-lockfile
	cd $(E2E) && $(PNPM) install --frozen-lockfile

dev: ## Run the API (:8080) and the frontend (:3000) together
	@$(MAKE) -j2 dev-api dev-web

dev-api: ## Run the API on :8080 (set SMTP_ADDR=localhost:1025 to send emails to Mailcatcher)
	cd $(API) && go run ./cmd/api

dev-web: ## Run the frontend on :3000
	cd $(WEB) && $(PNPM) dev

test: test-api test-web ## Run the tests of both apps

test-api: ## Run the API tests
	cd $(API) && go test ./...

test-web: ## Run the frontend tests
	cd $(WEB) && $(PNPM) test

e2e: ## Run the Playwright suite on its own API (:18080) and frontend (:13000), with Mailcatcher
	@curl -sf http://localhost:1080/messages >/dev/null || $(MAKE) mail
	cd $(E2E) && $(PNPM) exec playwright install chromium && $(PNPM) test

lint: lint-api lint-web lint-e2e ## Check format, lint and types of the apps and the e2e suite

lint-api: ## gofmt + go vet
	@cd $(API) && unformatted="$$(gofmt -l .)"; \
	if [ -n "$$unformatted" ]; then echo "gofmt: run 'gofmt -w' on:"; echo "$$unformatted"; exit 1; fi
	cd $(API) && go vet ./...

lint-web: ## Prettier + ESLint + TypeScript
	cd $(WEB) && $(PNPM) check && $(PNPM) lint && $(PNPM) typecheck

lint-e2e: ## Prettier + TypeScript on the e2e suite (no browser)
	cd $(E2E) && $(PNPM) check && $(PNPM) typecheck

build: build-api build-web ## Build both apps

build-api: ## Build the API binary to apps/api/bin/api
	cd $(API) && go build -o bin/api ./cmd/api

build-web: ## Build the frontend
	cd $(WEB) && $(PNPM) build

docs-budget: ## Check the size budget of the AGENTS.md files and the glossaries
	node tools/docs-budget/docs-budget.mjs
	node --test tools/docs-budget/docs-budget.test.mjs

check: docs-budget lint test build ## Everything the CI check job runs (the e2e job runs `make e2e`)

up: ## Run both apps in Docker Compose
	docker compose up --build

mail: ## Run Mailcatcher alone: SMTP on :1025, web UI on http://localhost:1080
	docker compose up -d mailcatcher

down: ## Stop Docker Compose
	docker compose down

.PHONY: help start stop logs clean ui server lint test install

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies
	uv sync

start: ## Start Docker services
	docker-compose up --build

stop: ## Stop Docker services
	docker-compose down

logs: ## Show Docker logs
	docker-compose logs -f

clean: ## Remove database and cache
	rm -rf data/ __pycache__ src/__pycache__ src/api/__pycache__

ui: ## Run TUI
	uv run python -m src.api.main

server: ## Run API server only
	uv run uvicorn src.api.server:app --host 0.0.0.0 --port 3000 --reload

lint: ## Run linter
	uv run ruff check src/

test: ## Run tests
	uv run pytest

.PHONY: help build start down logs clean install backend frontend restart

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies
	cd backend && npm install

backend: ## Start backend development server locally
	cd backend && npm run dev

frontend: ## Start frontend development server
	cd frontend && npm run dev

build: ## Build Docker images
	docker-compose build

start: ## Start Docker services with build
	docker-compose up --build

stop: ## Stop Docker services
	docker-compose down

logs: ## Show Docker logs
	docker-compose logs -f

clean: ## Stop services and remove volumes
	docker-compose down --volumes
	docker system prune --volumes -f

restart: down start ## Restart Docker services
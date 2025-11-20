# Load environment variables from .env file
include .env
export

.PHONY: help build start down logs clean install backend frontend restart

help: ## Show this help message
	@echo 'Usage: make [arg]'
	@echo ''
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install-dev: ## Install dependencies
	cd backend && npm install

start-dev: ## Start Docker services with build
	docker-compose up --build

stop-dev: ## Stop Docker services
	docker-compose down

logs-dev: ## Show Docker logs
	docker-compose logs -f

build-prod: ## EC2 Build and start containers in background
	docker-compose -f docker-compose.prod.yml up -d --build

logs-prod: ## EC2 View logs
	docker-compose -f docker-compose.prod.yml logs -f

clean: ## Stop services and remove volumes
	docker-compose down --volumes
	docker system prune --volumes -f

start-instance: ## Start EC2 instance
	aws ec2 start-instances --instance-ids $(EC2_INSTANCE_ID)

stop-instance: ## Stop EC2 instance
	aws ec2 stop-instances --instance-ids $(EC2_INSTANCE_ID)

ssh-connect: ## Connect to EC2 instance
	ssh -i zenigh-key.pem ubuntu@$(EC2_INSTANCE_PUBLIC_IP)

make lint:
	cd backend && npm run lint:fix
	cd frontend && npm run lint:fix

make test:
	cd backend && npm run test
	cd frontend && npm run test
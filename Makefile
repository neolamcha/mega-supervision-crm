.PHONY: help install dev build deploy seed test lint clean

help:
	@echo "Mega Supervision - Command Reference"
	@echo "===================================="
	@echo "make install     - Install all dependencies"
	@echo "make dev         - Start development environment"
	@echo "make build       - Build all services"
	@echo "make deploy      - Deploy with Docker Compose"
	@echo "make seed        - Seed database with initial data"
	@echo "make test        - Run all tests"
	@echo "make lint        - Run linters"
	@echo "make clean       - Clean build artifacts"

install:
	cd backend && npm install
	cd web && npm install
	cd mobile && npm install

dev:
	docker-compose up -d postgres redis
	cd backend && npm run start:dev &
	cd web && npm run dev &

build:
	cd backend && npm run build
	cd web && npm run build

deploy:
	docker-compose up -d --build

seed:
	cd backend && npm run seed

test:
	cd backend && npm test
	cd web && npm run lint

lint:
	cd backend && npm run lint
	cd web && npm run lint

clean:
	rm -rf backend/dist
	rm -rf web/.next
	rm -rf mobile/node_modules
	rm -rf backend/node_modules
	rm -rf web/node_modules

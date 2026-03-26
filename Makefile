# Feedback Widget & AI Agent Dashboard Makefile

.PHONY: install run test clean help setup build

# Default target
all: install

help:
	@echo "Usage:"
	@echo "  make install     Install all dependencies (Node.js & Python)"
	@echo "  make build       Build frontend and backend"
	@echo "  make run         Start the feedback backend server"
	@echo "  make test        Run backend and integration tests"
	@echo "  make clean       Remove temporary files, logs, and stored feedback"
	@echo "  make setup       Create necessary .env files (templates)"

install:
	@echo "Installing Node.js dependencies in frontend & backend..."
	cd frontend && pnpm install
	cd backend && pnpm install
	
build:
	@echo "Building frontend & backend..."
	cd frontend && pnpm run build
	cd backend && pnpm run build

run:
	@echo "Starting the Feedback Server at http://localhost:12345..."
	cd backend && pnpm start

test:
	@echo "Running tests..."
	cd backend && pnpm test

clean:
	@echo "Cleaning up..."
	rm -rf frontend/node_modules
	rm -rf backend/node_modules
	rm -f backend/feedbacks/*
	rm -f backend/jules_sources.json
	@echo "Clean complete."

setup:
	@echo "Setting up templates for environment variables..."
	cp backend/.env.example backend/.env || true
	@echo ".env templates created. Please update them with your API keys."

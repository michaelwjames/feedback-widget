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
	cd feedback-tool/frontend && pnpm install
	cd feedback-tool/backend && pnpm install
	
build:
	@echo "Building frontend & backend..."
	cd feedback-tool/frontend && pnpm run build
	cd feedback-tool/backend && pnpm run build

run:
	@echo "Starting the Feedback Server at http://localhost:12345..."
	cd feedback-tool/backend && pnpm start

test:
	@echo "Running tests..."
	cd feedback-tool/backend && pnpm test

clean:
	@echo "Cleaning up..."
	rm -rf feedback-tool/frontend/node_modules
	rm -rf feedback-tool/backend/node_modules
	rm -rf feedback-tool/feedbacks/*
	rm -f feedback-tool/backend/jules_sources.json
	find . -name "*.pyc" -delete
	find . -name "__pycache__" -delete
	@echo "Clean complete."

setup:
	@echo "Setting up templates for environment variables..."
	cp agents/groq-vision-ocr/.env.example agents/groq-vision-ocr/.env || true
	cp agents/jules-subagent/.env.example agents/jules-subagent/.env || true
	@echo ".env templates created. Please update them with your API keys."

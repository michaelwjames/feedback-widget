# Feedback Widget & AI Agent Dashboard Makefile

.PHONY: install run test clean help setup

# Default target
all: install

help:
	@echo "Usage:"
	@echo "  make install     Install all dependencies (Node.js & Python)"
	@echo "  make run         Start the feedback backend server"
	@echo "  make test        Run backend and integration tests"
	@echo "  make clean       Remove temporary files, logs, and stored feedback"
	@echo "  make setup       Create necessary .env files (templates)"

install:
	@echo "Installing Node.js dependencies in feedback-tool..."
	cd feedback-tool && npm install
	@echo "Installing Python dependencies for agents..."
	pip3 install -r agents/groq-vision-ocr/requirements.txt
	pip3 install -r agents/jules-subagent/requirements.txt

run:
	@echo "Starting the Feedback Server at http://localhost:12345..."
	cd feedback-tool && npm start

test:
	@echo "Running tests..."
	cd feedback-tool && npm test

clean:
	@echo "Cleaning up..."
	rm -rf feedback-tool/node_modules
	rm -rf feedback-tool/feedbacks/*
	rm -f feedback-tool/jules_sources.json
	find . -name "*.pyc" -delete
	find . -name "__pycache__" -delete
	@echo "Clean complete."

setup:
	@echo "Setting up templates for environment variables..."
	cp agents/groq-vision-ocr/.env.example agents/groq-vision-ocr/.env || true
	cp agents/jules-subagent/.env.example agents/jules-subagent/.env || true
	@echo ".env templates created. Please update them with your API keys."

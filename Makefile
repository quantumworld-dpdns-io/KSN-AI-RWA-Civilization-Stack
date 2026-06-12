.PHONY: dev build test clean

dev:
	docker-compose -f infra/docker-compose.yml -f docker-compose.dev.yml up --build

prod:
	docker-compose -f infra/docker-compose.yml -f docker-compose.prod.yml up -d --build

down:
	docker-compose -f infra/docker-compose.yml down

build:
	pnpm -r build

test:
	pnpm -r test

clean:
	pnpm -r clean
	rm -rf node_modules
	pnpm install
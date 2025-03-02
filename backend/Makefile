.PHONY: run build test clean

# Development
run:
	go run cmd/api/main.go

# Build
build:
	go build -o bin/api cmd/api/main.go

# Testing
test:
	go test -v ./...

# Clean
clean:
	rm -rf bin/
	go clean -testcache

# Dependencies
deps:
	go mod tidy
	go mod verify

# Docker
docker-build:
	docker build -t musefolio-api .

docker-run:
	docker run -p 8080:8080 --env-file .env musefolio-api 
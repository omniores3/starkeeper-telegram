APP=starkeeper
GO?=go

.PHONY: run build test fmt clean

run:
	$(GO) run ./cmd/server

build:
	$(GO) build -trimpath -ldflags="-s -w" -o bin/$(APP) ./cmd/server

test:
	$(GO) test ./...

fmt:
	gofmt -w cmd internal

clean:
	rm -rf bin data/starkeeper.db data/starkeeper.db-shm data/starkeeper.db-wal

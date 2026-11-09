# syntax=docker/dockerfile:1
FROM golang:1.27-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/starkeeper ./cmd/server

FROM alpine:3.22
RUN apk add --no-cache ca-certificates tzdata \
  && addgroup -S app && adduser -S -G app app \
  && mkdir -p /data/uploads && chown -R app:app /data
WORKDIR /app
COPY --from=build /out/starkeeper /app/starkeeper
USER app
ENV APP_ADDR=0.0.0.0:8787 \
    DB_PATH=/data/starkeeper.db \
    UPLOAD_DIR=/data/uploads \
    APP_TIMEZONE=Asia/Shanghai
VOLUME ["/data"]
EXPOSE 8787
ENTRYPOINT ["/app/starkeeper"]

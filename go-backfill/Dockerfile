FROM golang:1.23.3 AS builder

WORKDIR /app

COPY go.mod go.sum ./

RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=arm64 go build -o main .

FROM scratch

WORKDIR /app

COPY ./global-bundle.pem ./global-bundle.pem

COPY --from=builder /app/main .

CMD ["./main"]

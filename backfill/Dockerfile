FROM golang:1.23.3 AS builder
WORKDIR /app
COPY . .
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

FROM scratch
WORKDIR /app
COPY ./global-bundle.pem ./global-bundle.pem
COPY --from=builder /app/main .
CMD ["./main"]

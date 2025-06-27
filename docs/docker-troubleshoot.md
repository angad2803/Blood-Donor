# Docker Troubleshooting Steps

## Step 1: Check Docker status

docker version
docker info

## Step 2: Check if port 6379 is free

netstat -an | findstr 6379

## Step 3: Try simple Redis container

docker run --rm redis:latest redis-server --version

## Step 4: Start Redis with verbose output

docker run -d --name redis-test -p 6379:6379 redis:latest

## Step 5: Check logs

docker logs redis-test

## Step 6: Clean up

docker stop redis-test
docker rm redis-test

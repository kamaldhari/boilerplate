FROM node:20-alpine
WORKDIR /app

# Install Nano text editor, set permissions, and remove apk cache
RUN apk add --no-cache nano \
    && mkdir /usr/share/nano \
    && chmod -R 777 /usr/share/nano

COPY . .

# Install dependencies
RUN yarn install

# Increase memory limit for the build process
RUN NODE_OPTIONS="--max-old-space-size=4096" yarn run build
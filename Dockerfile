# Use a lightweight Node.js image
FROM node:20-slim

# Create and change to the app directory
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy local code to the container image.
COPY . .

# Run the proxy script
CMD [ "npm", "run", "proxy" ]

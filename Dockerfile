# Use Debian-based Node image for full glibc compatibility
FROM node:20-slim

# Create app directory
WORKDIR /app

# Install system dependencies for Node.js native modules
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application source
COPY . .

# Expose the port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# Run the application
CMD ["npm", "run", "dev"]
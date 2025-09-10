FROM node:20

# Set working directory to match docker-compose volume mount
WORKDIR /src

# Copy package files for better layer caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start Vite dev server with host flag to allow external connections
CMD ["npm", "run", "dev", "--", "--host"]
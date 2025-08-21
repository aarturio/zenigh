FROM node:18

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

RUN npm install

# Copy backend source code
COPY backend/ ./

EXPOSE 3000

CMD ["npm", "run", "dev"]
FROM node:22

WORKDIR /app

# Copy backend package files
COPY package*.json ./

RUN npm install

# Copy backend source code
COPY . ./

EXPOSE 3000

CMD ["npm", "run", "dev"]
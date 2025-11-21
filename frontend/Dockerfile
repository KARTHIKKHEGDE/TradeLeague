FROM node:20-alpine

WORKDIR /app

# Copy package.json and package-lock.json from app subfolder
COPY app/package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application code
COPY app/. .

# Build the app
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
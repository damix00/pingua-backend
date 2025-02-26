FROM node:22.12.0-alpine

WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install dependencies
RUN npm install -g typescript prisma
RUN npm install

# Copy the rest of the application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose the port
EXPOSE 9500

ENV NODE_ENV production

# Start the app
CMD ["npm", "start"]
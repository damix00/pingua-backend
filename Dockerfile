FROM node:22.12.0-alpine

WORKDIR /app

# Copy the application code
COPY . .

# Install dependencies
RUN npm install -g typescript prisma
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Expose the port
EXPOSE 9500

ENV NODE_ENV production

# Start the app
CMD ["npm", "start"]
FROM node:22.12.0-alpine

# copy the source code
COPY . /app
WORKDIR /app

# install dependencies
RUN npm install -g typescript prisma

RUN npx prisma generate
RUN npm install

# expose the port
EXPOSE 9500

ENV NODE_ENV production

# start the app
CMD npm start
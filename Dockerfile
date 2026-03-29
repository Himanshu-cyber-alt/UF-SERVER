FROM FROM node:24-alpine3.22

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 8000

CMD ["node","server.js"]



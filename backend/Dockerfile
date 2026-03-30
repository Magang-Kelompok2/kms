FROM node:20-alpine

WORKDIR /usr/src/app

COPY package.json package-lock.json* ./
RUN npm install typescript@latest && npm install

COPY . .
# RUN npm run build

EXPOSE 4000
CMD ["node", "dist/index.js"]

FROM node:20-alpine AS client-build

WORKDIR /client
COPY client/package*.json ./
RUN npm ci

COPY client/ .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY server/package*.json ./
RUN npm ci --omit=dev

COPY server/src ./src
COPY --from=client-build /client/dist ./public

EXPOSE 4000
CMD ["node", "src/index.js"]

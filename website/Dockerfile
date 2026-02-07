FROM node:24-bullseye-slim AS build

RUN corepack enable
RUN pnpm config set store-dir /pnpm-store

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

FROM node:24-bullseye-slim AS runner

RUN corepack enable
RUN pnpm config set store-dir /pnpm-store

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=build /app/dist ./dist
COPY server.js ./

USER node
EXPOSE 3000
CMD ["node", "server.js"]

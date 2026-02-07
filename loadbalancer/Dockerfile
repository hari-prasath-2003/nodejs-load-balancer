FROM node:24-bullseye-slim AS build

RUN corepack enable && pnpm config set store-dir /pnpm-store

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build


FROM node:24-bullseye-slim AS runner

RUN corepack enable && pnpm config set store-dir /pnpm-store

WORKDIR /app
RUN mkdir -p /app/logs \
 && chown -R node:node /app/logs


COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=build /app/dist ./dist

USER node
EXPOSE 3000
CMD ["node", "dist/app.js"]
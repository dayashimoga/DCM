FROM docker.io/library/node:20-alpine AS base

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

# Copy monorepo structure
COPY package.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Install dependencies & build
RUN npm install
RUN npm run build --workspace=@distributed-compute/shared-types
RUN cd apps/api && npx prisma generate && npm run build

EXPOSE 4000

CMD ["node", "apps/api/dist/main"]

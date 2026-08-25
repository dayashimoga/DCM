FROM docker.io/library/node:20-alpine AS builder

WORKDIR /app

# Copy monorepo structure
COPY package.json ./
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

# Install dependencies & build
RUN npm install
RUN npm run build --workspace=@distributed-compute/shared-types
RUN cd apps/web && npm run build

# Runner stage
FROM docker.io/library/node:20-alpine AS runner

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/apps/web/out ./out

EXPOSE 3000

CMD ["serve", "-s", "out", "-l", "3000"]

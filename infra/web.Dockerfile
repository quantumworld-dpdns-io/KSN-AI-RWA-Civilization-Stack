# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable pnpm
COPY . .
RUN pnpm install --frozen-lockfile=false
RUN pnpm --filter @aks/web... build

# Stage 2: Runner (Nginx)
FROM nginx:alpine AS runner
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

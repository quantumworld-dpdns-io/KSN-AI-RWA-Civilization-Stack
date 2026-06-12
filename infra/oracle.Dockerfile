FROM node:20-alpine
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps ./apps
RUN pnpm install --frozen-lockfile=false
EXPOSE 8787
CMD ["pnpm", "--filter", "@aks/oracle-sim", "dev"]

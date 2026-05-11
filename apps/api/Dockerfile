FROM node:20-alpine
WORKDIR /app

# Install workspace files
COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

RUN npm install --workspaces --include-workspace-root

COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

WORKDIR /app/apps/api
EXPOSE 4000
CMD ["npm", "run", "start"]

FROM node:krypton-alpine AS dev

WORKDIR /app

COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci --no-audit --no-fund && \
    npm cache clean --force

COPY . .

CMD ["npm", "start", "--", "--host=0.0.0.0", "--port=80"]

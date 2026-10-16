#
FROM docker.io/oven/bun:1.4.3-alpine as development

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

EXPOSE 3000

CMD [ "bun", "run", "dev" ]

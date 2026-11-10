# Development image for Docker and Podman (fully qualified base image so Podman needs no registry config).
# Dependencies are installed into the image; compose mounts the source on top for live reload.
FROM docker.io/oven/bun:1.4.3-alpine AS development

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

EXPOSE 5173

CMD ["bun", "--bun", "run", "dev", "--host", "0.0.0.0"]

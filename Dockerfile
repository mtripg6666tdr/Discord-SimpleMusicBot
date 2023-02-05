FROM node:18-buster-slim AS base
RUN apt-get update && \
    apt-get dist-upgrade -y && \
    apt-get install -y --no-install-recommends python3


FROM base AS builder
RUN apt-get install -y --no-install-recommends g++ make
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx tsc


FROM base AS runner
RUN apt-get install -y --no-install-recommends nscd
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm pkg delete scripts.prepare && npm ci --omit=dev
COPY --from=builder /app/dist /app/dist
RUN /bin/bash -c 'echo DOCKER_BUILD_IMAGE>DOCKER_BUILD_IMAGE'
RUN /bin/bash -c 'mkdir logs'

CMD ["/bin/bash", "-c", "service nscd start; node --dns-result-order=ipv4first dist/index.js"]

FROM node:20-bookworm-slim
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*
# The DFlow CLI publishes GNU/Linux builds.  Keep companion skill installation
# out of the runtime image; the Runner only needs the CLI binary.
RUN DFLOW_BIN_DIR=/usr/local/bin DFLOW_SKIP_SKILLS=1 \
  curl -fsSL https://cli.dflow.net/install.sh | sh -s -- --force --no-skills \
  && dflow --version
ENV DFLOW_AGENT=crazy-tuk \
    DFLOW_VERIFY_SIGNATURES=1
COPY package.json ./package.json
COPY server.mjs ./server.mjs
COPY dflow.mjs ./dflow.mjs
COPY migrate.mjs ./migrate.mjs
COPY db/schema.sql ./db/schema.sql
RUN npm install --omit=dev
EXPOSE 8080
CMD ["npm", "start"]

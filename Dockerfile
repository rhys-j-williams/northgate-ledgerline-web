# ledgerline-web. Thin wrapper over the shared Angular image; everything interesting is in
# platform-tooling/docker/angular/Dockerfile and platform-tooling/docker/nginx. Kept here so the
# pipeline's `docker build -f <app>/Dockerfile` convention holds and so the Node version is pinned
# next to .nvmrc where reviewers look for it (TOOL-1150).
#
# Build from the monorepo root:
#   podman build -f ledgerline-web/Dockerfile --build-arg GIT_SHA=$(git rev-parse HEAD) -t ledgerline-web .
#
# The build context is the monorepo root because the shared nginx config is copied in. Do not move
# it to ledgerline-web/; MOL tried that and ended up with a fork of nginx.conf (MOL-3350).

ARG NODE_VERSION=18.19.0
ARG NGINX_TAG=1-30

FROM artifactory.meridian.internal/docker-remote/library/node:${NODE_VERSION}-bullseye-slim AS build
ARG NPM_REGISTRY=https://artifactory.meridian.internal/artifactory/api/npm/npm-virtual/
ENV CI=true NG_CLI_ANALYTICS=false NODE_OPTIONS=--max-old-space-size=4096
WORKDIR /workspace
# .npmrc carries legacy-peer-deps for Canopy 3.7.2 (LDG-1187); patches/ must be present before
# npm ci because patch-package runs in postinstall.
COPY ledgerline-web/package.json ledgerline-web/package-lock.json ledgerline-web/.npmrc ./
COPY ledgerline-web/patches ./patches
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    npm config set registry "${NPM_REGISTRY}" && \
    npm ci --no-audit --no-fund --prefer-offline
COPY ledgerline-web/ .
RUN npx ng build --configuration production && \
    mkdir -p /out && cp -R dist/ledgerline-web/. /out/

FROM artifactory.meridian.internal/docker-redhat-remote/ubi9/nginx-124:${NGINX_TAG} AS runtime
ARG BUILD_TAG=local
ARG GIT_SHA=unknown
LABEL org.opencontainers.image.title="ledgerline-web" \
      org.opencontainers.image.vendor="Meridian Trust Bank, CSWT" \
      org.opencontainers.image.revision="${GIT_SHA}" \
      org.opencontainers.image.version="${BUILD_TAG}" \
      meridian.bank/app="ledgerline-web" \
      meridian.bank/team="treasury-digital" \
      meridian.bank/base-image="ubi9/nginx-124" \
      meridian.bank/scan-policy="GIS-STD-021"
USER 0
COPY platform-tooling/docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY platform-tooling/docker/nginx/security-headers.inc /etc/nginx/conf.d/security-headers.inc
COPY platform-tooling/docker/nginx/40-csp.sh /usr/local/bin/40-csp.sh
RUN rm -f /etc/nginx/conf.d/default.conf /etc/nginx/nginx.conf.default && \
    chmod 0755 /usr/local/bin/40-csp.sh && \
    chown -R 1001:0 /opt/app-root/src && chmod -R g=u /opt/app-root/src
USER 1001
COPY --from=build --chown=1001:0 /out/ /opt/app-root/src/
# Same-origin ingress defaults; the chart ConfigMap mounts over it. See src/app/core/config/runtime-config.ts.
COPY --from=build --chown=1001:0 /workspace/src/assets/env.json /opt/app-root/src/env.json
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD curl -fs http://localhost:8080/healthz || exit 1
ENTRYPOINT ["/bin/sh", "-c", "/usr/local/bin/40-csp.sh && exec nginx -g 'daemon off;'"]

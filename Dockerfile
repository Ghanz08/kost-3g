# Image produksi Kost 3g (Next.js standalone).
# Build di VPS dengan `--network host` supaya prerender bisa membaca Supabase kos di 127.0.0.1:8100.
FROM node:24-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Nilai NEXT_PUBLIC_* tertanam di bundel browser saat build; anon key memang publik.
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_UMAMI_WEBSITE_ID
ARG SUPABASE_URL=http://127.0.0.1:8100
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_UMAMI_WEBSITE_ID=$NEXT_PUBLIC_UMAMI_WEBSITE_ID \
    SUPABASE_URL=$SUPABASE_URL \
    NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3100 HOSTNAME=127.0.0.1
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3100
CMD ["node", "server.js"]

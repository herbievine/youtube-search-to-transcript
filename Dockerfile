FROM oven/bun:1 AS base

# Install yt-dlp via pip (so plugins work), deno, and dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    ffmpeg \
    curl \
    unzip \
    && curl -fsSL https://deno.land/install.sh | DENO_INSTALL=/usr/local sh \
    && pip3 install --break-system-packages yt-dlp bgutil-ytdlp-pot-provider \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

ENV PATH="/usr/local/bin:$PATH"

WORKDIR /app

# Install dependencies
FROM base AS install
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# Final image
FROM base AS release
COPY --from=install /app/node_modules ./node_modules
COPY src ./src
COPY package.json ./

RUN chown -R bun:bun /app

EXPOSE 3000
USER bun
ENTRYPOINT ["bun", "run", "src/index.ts"]

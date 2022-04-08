FROM denoland/deno:latest

WORKDIR /app

USER deno

COPY deps.ts .

RUN deno cache deps.ts

ADD --chown=deno:deno . .

CMD ["run", "--allow-all", "--importmap", "importmap.json", "--unstable", "src/main.ts"]
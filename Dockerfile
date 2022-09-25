FROM node:18-alpine3.16

COPY . /app

WORKDIR /app

RUN yarn install
RUN yarn build

ENV TGS_CONFIG=/app/config.yaml
ENTRYPOINT ["yarn", "run"]

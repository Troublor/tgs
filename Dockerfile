FROM node:18-alpine3.16

RUN apk add curl

# install rclone
RUN curl -O https://downloads.rclone.org/rclone-current-linux-amd64.zip
RUN unzip rclone-current-linux-amd64.zip
RUN cp rclone-*-linux-amd64/rclone /usr/bin/
RUN chown root:root /usr/bin/rclone
RUN chmod 755 /usr/bin/rclone

# install pg_dump
RUN apk add postgresql-client

# install hledger
RUN curl -L -O https://github.com/simonmichael/hledger/releases/download/1.27.1/hledger-linux-x64.zip
RUN unzip hledger-linux-x64.zip
RUN tar -xvf hledger-linux-x64.tar
RUN cp hledger hledger-ui hledger-web /usr/bin/
RUN chown root:root /usr/bin/hledger*
RUN chmod 755 /usr/bin/hledger*

COPY . /app

WORKDIR /app

RUN yarn install
RUN yarn build

ENV TGS_CONFIG=/app/config.yaml
ENTRYPOINT ["yarn", "start"]
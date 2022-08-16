FROM        node:16.16.0
MAINTAINER  bsbc.app@gmail.com

RUN apt-get update

RUN npm install pm2 -g

RUN pm2 install typescript
RUN pm2 install pm2-logrotate

RUN pm2 set pm2-logrotate

COPY ./ /app/

WORKDIR /app

RUN mkdir -p /volume

RUN ln -s /volume/config /app/config
RUN ln -s /volume/uploads /uploads

RUN yarn install

ENTRYPOINT ["/bin/sh", "run.sh"]

EXPOSE 4000

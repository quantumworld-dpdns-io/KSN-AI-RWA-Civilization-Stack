FROM redis:7-alpine
# Add custom Redis config if needed, otherwise just use standard
# COPY redis.conf /usr/local/etc/redis/redis.conf
CMD [ "redis-server", "--appendonly", "yes" ]
FROM alpine:3.19

RUN apk add --no-cache sqlite

RUN mkdir -p /data

COPY init.sh /init.sh
COPY healthcheck.sh /healthcheck.sh
RUN chmod +x /init.sh /healthcheck.sh

VOLUME /data

HEALTHCHECK --interval=5s --timeout=3s --start-period=10s --retries=3 \
    CMD /healthcheck.sh

CMD ["/bin/sh", "-c", "/init.sh && tail -f /dev/null"]

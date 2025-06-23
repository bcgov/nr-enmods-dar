FROM drakkan/sftpgo:edge

WORKDIR /tmp

COPY entrypoint.sh /tmp/entrypoint.sh

# Ports, health check and non-root user
EXPOSE 2222 8080
HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost/:8080/health
USER 1001

CMD ["sh", "/tmp/entrypoint.sh"]

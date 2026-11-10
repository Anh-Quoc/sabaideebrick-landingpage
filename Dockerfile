# ==========================================
# Sabaidee Brick Landing Page & Product Flyer
# Node.js Lightweight Container (No Nginx)
# ==========================================
FROM node:20-alpine

WORKDIR /app

# Copy application files and server
COPY index.html ./
COPY server.js ./
COPY images/ ./images/

# Expose web port
EXPOSE 7979

# Set default environment variables
ENV PORT=7979 \
    NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost:7979/ || exit 1

# Start Node.js static server
CMD ["node", "server.js"]

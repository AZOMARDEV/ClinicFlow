FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

EXPOSE 5173

# Vite dev server (enough for a demo); VITE_* variables are read from the container environment
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

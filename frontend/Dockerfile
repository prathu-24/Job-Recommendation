# Phase 1: Build React static bundle
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Phase 2: Host with Nginx
FROM nginx:alpine

# Copy built HTML/JS assets to default Nginx root path
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx proxy rules
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 for proxying
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

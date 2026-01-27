FROM node:20-alpine

WORKDIR /app

# Installer les dépendances système
RUN apk add --no-cache wget curl

# Créer les dossiers
RUN mkdir -p /app/cache /app/tiles

# Copier les fichiers du serveur
COPY server.js /app/server.js
COPY package.json /app/package.json
COPY download-tiles.js /app/download-tiles.js

# Installer les dépendances Node.js
RUN npm install

# Exposer le port
EXPOSE 8080

# Démarrer le serveur
CMD ["node", "server.js"]

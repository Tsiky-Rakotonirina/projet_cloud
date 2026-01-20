FROM node:20-alpine

WORKDIR /app

# Utiliser le package.json simplifié pour Docker (sans Cypress, Capacitor, etc.)
COPY package.docker.json ./package.json

# Installer les dépendances légères
RUN npm install

# Copier les fichiers de config
COPY vite.config.ts tsconfig*.json ./
COPY index.html ./

# Copier le code source
COPY src ./src

# Exposer le port Vite
EXPOSE 5174

# Démarrer le serveur de développement
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ---------------------------
# Étape 1 : Build de l'application
# ---------------------------
FROM node:20-alpine AS build

# Définir le répertoire de travail
WORKDIR /app

# Copier tout le projet (package.json, src, public, vite.config.ts, index.html, etc.)
COPY . .

# Installer les dépendances
RUN npm install

# Construire l'application pour la production
RUN npm run build

# ---------------------------
# Étape 2 : Serveur léger pour production
# ---------------------------
FROM node:20-alpine AS production

WORKDIR /app

# Installer un serveur statique léger
RUN npm install -g serve

# Copier les fichiers construits depuis l'étape build
COPY --from=build /app/dist ./dist

# Exposer le port 5000
EXPOSE 5000

# Commande pour démarrer le serveur
CMD ["serve", "-s", "dist", "-l", "5000"]

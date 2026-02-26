# MIA - Real vs AI 🎮

**MIA - Real vs AI** est une plateforme éducative et ludique conçue pour aider les utilisateurs, notamment les collégiens, à développer leur esprit critique face aux contenus générés par l'Intelligence Artificielle. Le but est simple : face à deux médias (image, vidéo ou audio), il faut deviner lequel est réel et lequel a été créé par une IA.

---

## 🌟 Fonctionnalités

### 🕹️ Mode Solo
- **Sessions rapides** : 10 paires de médias aléatoires par partie (images, vidéos, audio).
- **Système de Score** : Points basés sur la justesse et la rapidité.
- **Streak Bonus** : Multiplicateur de points pour les bonnes réponses consécutives.
- **Time Bonus** : Points supplémentaires si réponse en moins de 5 secondes.
- **Feedback Immédiat** : Explications détaillées après chaque réponse pour apprendre à repérer les indices de l'IA.
- **Classement** : Un leaderboard global pour se mesurer aux autres joueurs.

### 👥 Mode Live (Classe)
- **Compétition en temps réel** : Un enseignant/hôte projette le média, les élèves répondent sur leurs tablettes ou smartphones.
- **Accès Simplifié** : Connexion via QR Code ou code de salon à 6 caractères.
- **Synchronisation Totale** : WebSockets pour une expérience fluide sans rafraîchissement.
- **Podium Animé** : Affichage final des gagnants avec effets de confettis et animations de podium.
- **Anti-Triche** : Persistance de session pour permettre la reconnexion en cas de coupure réseau.
- **Bonus de position** : Les premiers à répondre correctement gagnent plus de points (+50, +30, +10).

### 🔐 Interface Administration
- **Dashboard de Statistiques** : Visualisation des performances globales, par type d'audience (scolaire / grand public).
- **Gestion du Contenu** : CRUD complet pour les catégories et les paires de médias (images, vidéos, audio).
- **Upload Simplifié** : Gestion centralisée des fichiers avec filtrage par catégorie, type et difficulté.
- **Gestion des sessions** : Consultation et suppression des sessions de jeu.

### 🏛️ Musée des Hallucinations
- **Easter Egg** : Galerie interactive présentant les artefacts visuels typiques de l'IA (texte fantôme, lissage de porcelaine, fusion d'objets, etc.).

---

## 🛠 Stack Technique

### Backend
- **Framework** : Django 5.0 & Django REST Framework
- **Temps Réel** : Django Channels & Redis (WebSockets)
- **Serveur ASGI** : Daphne
- **Base de données** : PostgreSQL

### Frontend
- **Framework** : React 18 (TypeScript)
- **Build Tool** : Vite
- **Styling** : TailwindCSS
- **Animations** : Framer Motion
- **Effets** : canvas-confetti

### Infrastructure
- **Containerisation** : Docker & Docker Compose
- **Reverse Proxy** : Nginx (sert les médias statiques, proxy API + WebSockets + frontend)

---

## 🚀 Installation et Lancement

### Prérequis
- [Docker](https://docs.docker.com/get-docker/) et [Docker Compose](https://docs.docker.com/compose/install/)
- Git

### Étapes

1. **Cloner le projet**
   ```bash
   git clone git@github.com:MaisonIA06/Real_VS_AI.git
   cd Real_VS_AI
   ```

2. **Lancer les conteneurs**
   ```bash
   docker compose up --build -d
   ```

3. **Peupler la base de données avec les paires existantes**
   ```bash
   docker exec realvsai_backend python manage.py populate_pairs
   ```
   > Ce script scanne automatiquement `backend/media/pairs/real/` et `backend/media/pairs/ai/` pour créer les catégories et paires de médias en base de données.
   > Convention de nommage : `Nom.ext` (réel) ↔ `Nom_AI.ext` (IA), organisés par dossier-catégorie.

4. **Accès aux services**
   | Service | URL |
   |---|---|
   | Application (Frontend) | [http://localhost:8080](http://localhost:8080) |
   | API REST | [http://localhost:8080/api/](http://localhost:8080/api/) |
   | Interface Admin | [http://localhost:8080/admin](http://localhost:8080/admin) |

### Commandes utiles

```bash
# Voir les logs
docker compose logs -f

# Arrêter les conteneurs
docker compose down

# Arrêter et supprimer les données (base de données)
docker compose down -v

# Relancer après un git pull
docker compose up --build -d
docker exec realvsai_backend python manage.py populate_pairs

# Aperçu des paires détectées (sans modifier la base)
docker exec realvsai_backend python manage.py populate_pairs --dry-run
```

---

## 📁 Structure du Projet

```text
Real_VS_AI/
├── backend/                    # API Django, Channels et logique métier
│   ├── apps/
│   │   ├── game/               # Modèles, vues, WebSocket consumers, management commands
│   │   └── admin_api/          # API d'administration (CRUD catégories/paires, stats)
│   ├── config/                 # Configuration (settings, asgi, urls, routing)
│   └── media/                  # Stockage des fichiers médias
│       └── pairs/
│           ├── real/           # Médias réels organisés par catégorie
│           └── ai/             # Médias IA organisés par catégorie
├── frontend/                   # Application React
│   ├── src/
│   │   ├── components/         # Composants réutilisables (Timer, MediaDisplay, etc.)
│   │   ├── pages/              # Pages principales + multiplayer + admin
│   │   ├── hooks/              # Hooks personnalisés (useGameSession, useMultiplayerSocket)
│   │   └── services/           # Configuration API Axios
│   └── public/                 # Assets statiques (images easter egg, favicon)
├── nginx/                      # Configuration du reverse proxy
├── scripts/                    # Scripts de lancement kiosk (Linux, Windows)
└── docker-compose.yml          # Orchestration des 5 conteneurs
```

---

## 🔄 Synchronisation entre machines

Les **fichiers médias** (images/vidéos) sont versionnés dans Git. Les **données de la base** (catégories, paires) sont recréées automatiquement grâce au script `populate_pairs`.

**Sur une nouvelle machine après un clone ou un pull :**
```bash
git pull origin main
docker compose up --build -d
docker exec realvsai_backend python manage.py populate_pairs
```

**Pour ajouter de nouvelles paires :**
1. Placer les fichiers dans `backend/media/pairs/real/{catégorie}/Nom.ext` et `backend/media/pairs/ai/{catégorie}/Nom_AI.ext`
2. Commiter et pusher les fichiers
3. Lancer `docker exec realvsai_backend python manage.py populate_pairs` (les paires existantes ne sont pas dupliquées)

---

## 📝 À propos de MIA
Ce projet s'inscrit dans une démarche pédagogique visant à sensibiliser aux enjeux de l'IA et de la désinformation par le jeu et l'expérimentation visuelle.

---
© 2026 MIA Project - Tous droits réservés.

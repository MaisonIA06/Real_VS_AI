# MIA - Real vs AI 🎮

**MIA - Real vs AI** est une plateforme éducative et ludique conçue pour aider les utilisateurs, notamment les collégiens, à développer leur esprit critique face aux contenus générés par l'Intelligence Artificielle. Le but est simple : face à deux médias (image ou vidéo), il faut deviner lequel est réel et lequel a été créé par une IA.

---

## 🌟 Fonctionnalités

### 🕹️ Mode Solo
- **Sessions rapides** : 10 paires de médias par partie.
- **Système de Score** : Points basés sur la justesse et la rapidité.
- **Streak Bonus** : Multiplicateur de points pour les bonnes réponses consécutives.
- **Feedback Immédiat** : Explications détaillées après chaque réponse pour apprendre à repérer les indices de l'IA.
- **Classement** : Un leaderboard global pour se mesurer aux autres joueurs.

### 👥 Mode Live (Classe)
- **Compétition en temps réel** : Un enseignant/hôte projette le média, les élèves répondent sur leurs tablettes ou smartphones.
- **Accès Simplifié** : Connexion via QR Code ou code de salon à 4 caractères.
- **Synchronisation Totale** : WebSockets pour une expérience fluide sans rafraîchissement.
- **Podium Animé** : Affichage final des gagnants avec effets de confettis et animations de podium.
- **Anti-Triche** : Persistance de session pour permettre la reconnexion en cas de coupure réseau.

### 🔐 Interface Administration
- **Dashboard de Statistiques** : Visualisation des performances globales et des médias les plus trompeurs.
- **Gestion du Contenu** : CRUD complet pour les catégories et les paires de médias.
- **Éditeur de Quiz** : Création de parcours thématiques ou mode aléatoire.
- **Upload Simplifié** : Gestion centralisée des images et vidéos.

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
- **Reverse Proxy** : Nginx

---

## 🚀 Installation et Lancement

### Prérequis
- [Docker](https://docs.docker.com/get-docker/) et [Docker Compose](https://docs.docker.com/compose/install/)
- Git

### Étapes

1. **Cloner le projet**
   ```bash
   git clone <repo-url>
   cd Real_Vs_AI
   ```



2. **Lancement avec Docker**
   ```bash
   docker-compose up --build
   ```

3. **Accès aux services**
   - **Application (Frontend)** : [http://localhost:8080](http://localhost:8080)
   - **API REST** : [http://localhost:8080/api/](http://localhost:8080/api/)
   - **Admin Django** : [http://localhost:8080/admin/](http://localhost:8080/admin/)

---

## 📁 Structure du Projet

```text
WebApp/
├── backend/                # API Django, Channels et Logique métier
│   ├── apps/               # Applications Django (game, admin_api)
│   ├── config/             # Configuration (settings, asgi, routing)
│   └── media/              # Stockage des fichiers images/vidéos
├── frontend/               # Application React
│   ├── src/components/     # Composants réutilisables
│   ├── src/pages/          # Vues principales et mode multiplayer
│   ├── src/hooks/          # Logique partagée (WebSockets, API)
│   └── src/services/       # Configuration API Axios
├── nginx/                  # Configuration du proxy et service des médias
└── docker-compose.yml      # Orchestration des conteneurs
```

---

## 📝 À propos de MIA
Ce projet s'inscrit dans une démarche pédagogique visant à sensibiliser aux enjeux de l'IA et de la désinformation par le jeu et l'expérimentation visuelle.

---
© 2026 MIA Project - Tous droits réservés.

# Real vs AI 🎮

Un jeu interactif où l'utilisateur doit deviner quelle image ou vidéo est réelle, et laquelle a été générée par une IA.

## 🚀 Démarrage rapide

### Prérequis

- Docker et Docker Compose
- Git

### Installation

1. Clonez le repository :
```bash
git clone <repo-url>
cd WebApp
```

2. Copiez le fichier d'environnement et configurez-le :
```bash
cp .env.example .env
# Éditez .env avec vos paramètres
```

3. Lancez l'application avec Docker :
```bash
docker-compose up --build
```

4. Accédez à l'application :
   - **Frontend** : http://localhost:8080
   - **API** : http://localhost:8080/api
   - **Admin Django** : http://localhost:8080/admin

### Développement

Pour le développement, vous pouvez accéder directement aux services :
- Frontend (Vite HMR) : http://localhost:5173
- Backend (Django) : http://localhost:8000

## 📁 Structure du projet

```
WebApp/
├── docker-compose.yml      # Configuration Docker
├── backend/                # Django + DRF
│   ├── config/             # Configuration Django
│   ├── apps/
│   │   ├── game/           # Logique du jeu
│   │   └── admin_api/      # API d'administration
│   └── media/              # Fichiers médias uploadés
├── frontend/               # React + Vite
│   ├── src/
│   │   ├── components/     # Composants React
│   │   ├── pages/          # Pages
│   │   ├── hooks/          # Custom hooks
│   │   └── services/       # API client
└── nginx/                  # Configuration Nginx
```

## 🎯 Fonctionnalités

### Jeu
- 10 paires d'images/vidéos par session
- Timer de 30 secondes par question
- Système de score avec streak bonus
- Classement des joueurs
- Feedback immédiat avec animations

### Administration
- Dashboard avec statistiques
- Gestion des catégories
- Upload et gestion des paires de médias
- Création de quiz personnalisés
- Mode aléatoire

## 🛠 Stack technique

- **Backend** : Django 5.0, Django REST Framework, PostgreSQL
- **Frontend** : React 18, TypeScript, Vite, TailwindCSS, Framer Motion
- **Infrastructure** : Docker, Nginx

## 📊 API Endpoints

### Game API
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/game/quizzes/` | Liste des quiz |
| POST | `/api/game/sessions/` | Démarrer une session |
| POST | `/api/game/sessions/{key}/answer/` | Soumettre une réponse |
| GET | `/api/game/sessions/{key}/result/` | Résultat final |
| GET | `/api/game/leaderboard/` | Classement |

### Admin API
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| CRUD | `/api/admin/categories/` | Gestion catégories |
| CRUD | `/api/admin/media-pairs/` | Gestion paires |
| CRUD | `/api/admin/quizzes/` | Gestion quiz |
| GET | `/api/admin/stats/` | Statistiques |

## 🎨 Interface

L'interface utilise un design moderne et sombre avec :
- Palette de couleurs : violet/cyan en dégradé
- Animations fluides avec Framer Motion
- Effets de glassmorphism
- Responsive design

## 📝 Licence

MIT


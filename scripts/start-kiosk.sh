#!/usr/bin/env bash
# =============================================================================
# Script de lancement Real vs AI en mode Kiosque (plein écran) - Ubuntu/Linux
# =============================================================================

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Se placer dans le dossier du projet (parent du dossier scripts)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

URL="http://localhost:8080"
WAIT_SECONDS=15

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}   Real vs AI - Mode Kiosque${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# -------------------------------------------------------
# Déterminer si on a besoin de sudo pour Docker
# -------------------------------------------------------
DOCKER_CMD="docker"
if ! docker info &> /dev/null; then
    # Docker ne répond pas sans sudo, on teste avec sudo
    if sudo -n docker info &> /dev/null 2>&1; then
        DOCKER_CMD="sudo docker"
    else
        # sudo nécessite un mot de passe, on le demande une seule fois
        echo -e "${YELLOW}Droits administrateur requis pour Docker...${NC}"
        sudo docker info &> /dev/null
        DOCKER_CMD="sudo docker"
    fi
fi

# -------------------------------------------------------
# Étape 0 : Vérification de Docker
# -------------------------------------------------------
echo -e "${YELLOW}[0/3] Vérification de Docker...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}   ERREUR: Docker non trouvé !${NC}"
    echo -e "${RED}========================================${NC}"
    echo ""
    echo -e "${YELLOW}Veuillez installer Docker Engine :${NC}"
    echo -e "${CYAN}https://docs.docker.com/engine/install/ubuntu/${NC}"
    echo ""
    echo "Appuyez sur Entrée pour quitter..."
    read -r
    exit 1
fi

# Vérifier si Docker daemon tourne
if ! $DOCKER_CMD info &> /dev/null; then
    echo -e "${YELLOW}Docker n'est pas lancé. Tentative de démarrage...${NC}"

    # Essayer de démarrer via systemd
    if command -v systemctl &> /dev/null; then
        echo -e "Démarrage du service Docker via systemd..."
        sudo systemctl start docker 2>/dev/null || true
    fi

    # Attente du démarrage de Docker
    echo -e "${YELLOW}Attente du démarrage de Docker (peut prendre 15-30 secondes)...${NC}"
    MAX_WAIT=60
    WAITED=0
    INTERVAL=3

    while [ $WAITED -lt $MAX_WAIT ]; do
        if $DOCKER_CMD info &> /dev/null; then
            break
        fi
        sleep $INTERVAL
        WAITED=$((WAITED + INTERVAL))
        echo "  Attente... (${WAITED}/${MAX_WAIT}s)"
    done

    if ! $DOCKER_CMD info &> /dev/null; then
        echo ""
        echo -e "${RED}========================================${NC}"
        echo -e "${RED}   ERREUR: Docker n'a pas démarré${NC}"
        echo -e "${RED}========================================${NC}"
        echo ""
        echo -e "${YELLOW}Veuillez démarrer Docker manuellement :${NC}"
        echo -e "  sudo systemctl start docker"
        echo -e "puis relancer ce script."
        echo ""
        echo "Appuyez sur Entrée pour quitter..."
        read -r
        exit 1
    fi
fi

echo -e "${GREEN}Docker est opérationnel !${NC}"
echo ""

# -------------------------------------------------------
# Étape 1 : Lancer Docker Compose
# -------------------------------------------------------
echo -e "${YELLOW}[1/3] Démarrage des services Docker...${NC}"

# Déterminer la commande docker compose (v2) ou docker-compose (v1)
if $DOCKER_CMD compose version &> /dev/null; then
    COMPOSE_CMD="$DOCKER_CMD compose"
elif command -v docker-compose &> /dev/null; then
    if [ "$DOCKER_CMD" = "sudo docker" ]; then
        COMPOSE_CMD="sudo docker-compose"
    else
        COMPOSE_CMD="docker-compose"
    fi
else
    echo -e "${RED}Erreur: ni 'docker compose' ni 'docker-compose' n'est disponible.${NC}"
    echo "Appuyez sur Entrée pour quitter..."
    read -r
    exit 1
fi

$COMPOSE_CMD up -d --build

if [ $? -ne 0 ]; then
    echo -e "${RED}Erreur lors du démarrage de Docker Compose${NC}"
    echo "Appuyez sur Entrée pour quitter..."
    read -r
    exit 1
fi

# -------------------------------------------------------
# Étape 2 : Attendre le démarrage des services
# -------------------------------------------------------
echo -e "${YELLOW}[2/3] Attente du démarrage des services (${WAIT_SECONDS} secondes)...${NC}"
sleep $WAIT_SECONDS

# -------------------------------------------------------
# Étape 3 : Vérifier la disponibilité et ouvrir le navigateur
# -------------------------------------------------------
echo -e "${YELLOW}[3/3] Vérification de la disponibilité...${NC}"

MAX_RETRIES=10
RETRY_COUNT=0
SERVICE_READY=false

while [ "$SERVICE_READY" = false ] && [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s -o /dev/null -w "%{http_code}" "$URL" 2>/dev/null | grep -q "200\|301\|302"; then
        SERVICE_READY=true
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        echo "  Tentative ${RETRY_COUNT}/${MAX_RETRIES}..."
        sleep 2
    fi
done

if [ "$SERVICE_READY" = false ]; then
    echo -e "${YELLOW}Attention: Le service ne répond pas encore, ouverture du navigateur quand même...${NC}"
fi

echo ""
echo -e "${GREEN}Ouverture du navigateur en mode plein écran...${NC}"
echo -e "URL: ${URL}"
echo ""
echo -e "${CYAN}Pour quitter : F11 ou Alt+F4${NC}"
echo ""

# Détecter le navigateur et lancer en mode kiosque
BROWSER_LAUNCHED=false

# Essayer Google Chrome
for chrome_path in "google-chrome" "google-chrome-stable" "chromium-browser" "chromium"; do
    if command -v "$chrome_path" &> /dev/null; then
        echo "Utilisation de ${chrome_path}"
        nohup "$chrome_path" --kiosk --disable-infobars --disable-session-crashed-bubble "$URL" &>/dev/null &
        BROWSER_LAUNCHED=true
        break
    fi
done

# Essayer Firefox
if [ "$BROWSER_LAUNCHED" = false ]; then
    if command -v firefox &> /dev/null; then
        echo "Utilisation de Firefox"
        nohup firefox --kiosk "$URL" &>/dev/null &
        BROWSER_LAUNCHED=true
    fi
fi

# Fallback : xdg-open (navigateur par défaut)
if [ "$BROWSER_LAUNCHED" = false ]; then
    echo "Ouverture avec le navigateur par défaut..."
    xdg-open "$URL" &>/dev/null &
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Application lancée avec succès !${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Pour arrêter les services : ./scripts/stop-app.sh"
echo ""

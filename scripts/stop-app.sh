#!/usr/bin/env bash
# =============================================================================
# Script d'arrêt Real vs AI - Ubuntu/Linux
# =============================================================================

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

# Se placer dans le dossier du projet (parent du dossier scripts)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}   Real vs AI - Arrêt des services${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Déterminer la commande docker compose
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

echo "Arrêt des conteneurs Docker..."
$COMPOSE_CMD down

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Services arrêtés avec succès !${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

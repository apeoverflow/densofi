#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Environment configurations
LOCAL_CONFIG="NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_ENV=development"

PROD_CONFIG="NEXT_PUBLIC_API_BASE_URL=https://api.spiinz.com
NEXT_PUBLIC_API_URL=https://api.spiinz.com/api
NEXT_PUBLIC_BACKEND_URL=https://api.spiinz.com
NEXT_PUBLIC_ENV=production"

# Function to show current environment
show_current() {
    echo -e "${BLUE}📋 Current Environment Configuration:${NC}"
    echo "----------------------------------------"
    if [[ -f .env.local ]]; then
        cat .env.local
        echo
        # Detect current environment
        if grep -q "localhost" .env.local; then
            echo -e "Environment: ${GREEN}LOCAL (localhost:8000)${NC}"
        elif grep -q "api.spiinz.com" .env.local; then
            echo -e "Environment: ${YELLOW}PRODUCTION (api.spiinz.com)${NC}"
        else
            echo -e "Environment: ${RED}UNKNOWN${NC}"
        fi
    else
        echo -e "${RED}❌ No .env.local file found${NC}"
    fi
    echo
}

# Function to backup current .env.local
backup_env() {
    if [[ -f .env.local ]]; then
        cp .env.local .env.local.backup
        echo -e "${GREEN}✅ Backed up .env.local to .env.local.backup${NC}"
    fi
}

# Function to switch to local environment
switch_to_local() {
    backup_env
    echo "$LOCAL_CONFIG" > .env.local
    echo -e "${GREEN}🏠 Switched to LOCAL environment (localhost:8000)${NC}"
    echo -e "${BLUE}💡 Your frontend will now connect to: http://localhost:8000${NC}"
    echo
}

# Function to switch to production environment
switch_to_prod() {
    backup_env
    echo "$PROD_CONFIG" > .env.local
    echo -e "${YELLOW}🌐 Switched to PRODUCTION environment (api.spiinz.com)${NC}"
    echo -e "${BLUE}💡 Your frontend will now connect to: https://api.spiinz.com${NC}"
    echo
}

# Function to restore from backup
restore_backup() {
    if [[ -f .env.local.backup ]]; then
        cp .env.local.backup .env.local
        echo -e "${GREEN}🔄 Restored .env.local from backup${NC}"
        show_current
    else
        echo -e "${RED}❌ No backup file found (.env.local.backup)${NC}"
    fi
}

# Function to show help
show_help() {
    echo -e "${BLUE}🔧 Environment Switcher Help${NC}"
    echo "================================"
    echo "Usage: ./swap-env.sh [command]"
    echo
    echo "Commands:"
    echo "  local     - Switch to local development (localhost:8000)"
    echo "  prod      - Switch to production (api.spiinz.com)"
    echo "  status    - Show current environment configuration"
    echo "  restore   - Restore from backup (.env.local.backup)"
    echo "  help      - Show this help message"
    echo
    echo "Examples:"
    echo "  ./swap-env.sh local   # Test against localhost backend"
    echo "  ./swap-env.sh prod    # Test against GCP backend"
    echo "  ./swap-env.sh status  # See current config"
    echo
}

# Main script logic
case "${1:-status}" in
    "local" | "localhost" | "dev")
        echo -e "${BLUE}🔄 Switching to LOCAL environment...${NC}"
        switch_to_local
        show_current
        echo -e "${GREEN}💻 Run 'npm run dev' to test with localhost backend${NC}"
        ;;
    "prod" | "production" | "gcp")
        echo -e "${BLUE}🔄 Switching to PRODUCTION environment...${NC}"
        switch_to_prod
        show_current
        echo -e "${YELLOW}🌐 Run 'npm run dev' to test with GCP backend${NC}"
        ;;
    "status" | "current" | "show")
        show_current
        ;;
    "restore" | "backup")
        restore_backup
        ;;
    "help" | "-h" | "--help")
        show_help
        ;;
    *)
        echo -e "${RED}❌ Unknown command: $1${NC}"
        echo
        show_help
        exit 1
        ;;
esac 
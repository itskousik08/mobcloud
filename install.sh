#!/bin/bash

# --- COLORS & STYLES ---
RED='\033[1;31m'
GREEN='\033[1;32m'
YELLOW='\033[1;33m'
BLUE='\033[1;34m'
CYAN='\033[1;36m'
WHITE='\033[1;37m'
RESET='\033[0m'

# --- TRAP CTRL+C ---
trap "echo -e '\n${RED}[!] Exiting MobCloud...${RESET}'; exit 1" SIGINT

# --- BANNER FUNCTION ---
banner() {
    clear
    echo -e "${CYAN}"
    echo "███╗   ███╗ ██████╗ ██████╗  ██████╗██╗      ██████╗ ██╗   ██╗██████╗ "
    echo "████╗ ████║██╔═══██╗██╔══██╗██╔════╝██║     ██╔═══██╗██║   ██║██╔══██╗"
    echo "██╔████╔██║██║   ██║██████╔╝██║     ██║     ██║   ██║██║   ██║██║  ██║"
    echo "██║╚██╔╝██║██║   ██║██╔══██╗██║     ██║     ██║   ██║██║   ██║██║  ██║"
    echo "██║ ╚═╝ ██║╚██████╔╝██████╔╝╚██████╗███████╗╚██████╔╝╚██████╔╝██████╔╝"
    echo "╚═╝     ╚═╝ ╚═════╝ ╚═════╝  ╚═════╝╚══════╝ ╚═════╝  ╚═════╝ ╚═════╝ "
    echo -e "${YELLOW}      .:. Ultimate Local AI Website Builder for Termux .:. ${RESET}"
    echo -e "${RED}      .:.       Created by @Koudik53       .:. ${RESET}"
    echo -e "${BLUE}==============================================================${RESET}"
    echo ""
}

# --- DEPENDENCY CHECK ---
check_dependencies() {
    echo -e "${WHITE}[*] Checking System Environment...${RESET}"
    
    # Check for Termux
    if [ -n "$TERMUX_VERSION" ]; then
        PKG_MGR="pkg"
    else
        PKG_MGR="sudo apt"
    fi

    # Check Node.js
    if command -v node > /dev/null; then
        echo -e "${GREEN}[✔] Node.js found.${RESET}"
    else
        echo -e "${RED}[✘] Installing Node.js...${RESET}"
        $PKG_MGR install nodejs -y > /dev/null 2>&1
    fi

    # Check Ollama
    if command -v ollama > /dev/null; then
        echo -e "${GREEN}[✔] Ollama AI Engine found.${RESET}"
    else
        echo -e "${RED}[✘] Installing Ollama (This takes time)...${RESET}"
        if [ -n "$TERMUX_VERSION" ]; then
            pkg install ollama -y > /dev/null 2>&1
        else
            curl -fsSL https://ollama.com/install.sh | sh > /dev/null 2>&1
        fi
    fi
    sleep 1
}

# --- MAIN MENU ---
banner
check_dependencies
echo ""
echo -e "${WHITE}[?] Select AI Model for MobCloud:${RESET}"
echo -e "${BLUE}--------------------------------------------------${RESET}"
echo -e "${GREEN}[01]${RESET} Qwen 2.5 (0.5B)    ${RED}[~390 MB]${RESET} ${YELLOW}(Fastest / Low Storage)${RESET}"
echo -e "${GREEN}[02]${RESET} Qwen 2.5 Coder     ${RED}[~1.0 GB]${RESET} ${YELLOW}(Best for Coding / Balanced)${RESET}"
echo -e "${GREEN}[03]${RESET} DeepSeek Coder     ${RED}[~800 MB]${RESET} ${YELLOW}(Good Logic / Medium)${RESET}"
echo -e "${GREEN}[04]${RESET} Llama 3.2 (1B)     ${RED}[~1.3 GB]${RESET} ${YELLOW}(Smart / Medium RAM)${RESET}"
echo -e "${GREEN}[05]${RESET} TinyLlama          ${RED}[~600 MB]${RESET} ${YELLOW}(Old but reliable)${RESET}"
echo -e "${BLUE}--------------------------------------------------${RESET}"
echo -n -e "${CYAN}root@mobcloud:~# ${RESET}"
read choice

# --- MODEL SELECTION LOGIC ---
case $choice in
    1|01)
        MODEL_NAME="qwen2.5:0.5b"
        ;;
    2|02)
        MODEL_NAME="qwen2.5-coder:1.5b"
        ;;
    3|03)
        MODEL_NAME="deepseek-coder:1.3b"
        ;;
    4|04)
        MODEL_NAME="llama3.2:1b"
        ;;
    5|05)
        MODEL_NAME="tinyllama"
        ;;
    *)
        echo -e "${RED}[!] Invalid Option. Defaulting to Qwen 0.5B${RESET}"
        MODEL_NAME="qwen2.5:0.5b"
        ;;
esac

# Save Config for Server
echo "{ \"model\": \"$MODEL_NAME\" }" > config.json

# --- INSTALLATION PROCESS ---
banner
echo -e "${YELLOW}[*] Selected Model: ${WHITE}$MODEL_NAME${RESET}"
echo -e "${YELLOW}[*] Starting Local AI Server...${RESET}"

# Start Ollama Background
if pgrep -x "ollama" > /dev/null; then
    echo -e "${GREEN}[✔] Ollama is already running.${RESET}"
else
    ollama serve > /dev/null 2>&1 &
    PID=$!
    echo -e "${BLUE}[*] Waiting for server initialization (5s)...${RESET}"
    sleep 5
fi

# Pull Model
echo -e "${CYAN}[*] Downloading AI Model... (Don't close app!)${RESET}"
ollama pull $MODEL_NAME

# Install NPM
if [ -f "package.json" ]; then
    echo -e "${BLUE}[*] Updating backend modules...${RESET}"
    npm install --silent
else
    echo -e "${RED}[!] Error: package.json missing!${RESET}"
    exit 1
fi

# --- FINAL LAUNCH ---
banner
echo -e "${GREEN}==============================================${RESET}"
echo -e "${GREEN}   ✔ MOBCLOUD INSTALLED SUCCESSFULLY! ${RESET}"
echo -e "${GREEN}==============================================${RESET}"
echo -e "${WHITE}   AI Model: $MODEL_NAME ${RESET}"
echo -e "${WHITE}   Status:   Active ${RESET}"
echo -e "${YELLOW}   Starting Server...${RESET}"
echo -e "${CYAN}   >> Open: http://localhost:3000${RESET}"
echo ""

npm start

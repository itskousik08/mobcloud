#!/bin/bash

# --- MobCloud Installer (Powered by Qwen) ---

echo -e "\033[1;36m>>> MobCloud: Installing System (Qwen Engine) <<<\033[0m"

# 1. Environment Setup (Termux vs Linux)
if [ -n "$TERMUX_VERSION" ]; then
    echo ">> 📱 Termux detected."
    PKG_MGR="pkg"
    IS_TERMUX=true
else
    echo ">> 💻 Linux detected."
    PKG_MGR="sudo apt"
    IS_TERMUX=false
fi

# 2. Install Dependencies (Node.js, Git, Python)
echo ">> 📦 Installing base packages..."
if [ "$IS_TERMUX" = true ]; then
    pkg update -y && pkg upgrade -y
    pkg install nodejs git python rust -y 
else
    sudo apt update
    sudo apt install nodejs npm git curl -y
fi

# 3. Install Ollama
echo ">> 🤖 Checking/Installing Ollama..."
if ! command -v ollama &> /dev/null; then
    if [ "$IS_TERMUX" = true ]; then
        pkg install ollama -y
    else
        curl -fsSL https://ollama.com/install.sh | sh
    fi
else
    echo ">> ✅ Ollama is already installed."
fi

# 4. Install NPM Project Dependencies
echo ">> 📚 Installing Node modules..."
if [ -f "package.json" ]; then
    npm install
else
    echo "⚠️ Error: package.json not found. Make sure you are inside 'mobcloud' folder."
    exit 1
fi

# 5. Start Ollama & Download Qwen Model
# Yahan hum define kar rahe hain ki konsa model chahiye
# 'qwen2.5-coder:1.5b' mobile ke liye best aur fast hai.
# Agar phone powerful hai (8GB+ RAM), toh 'qwen2.5-coder:7b' use kar sakte hain.
MODEL_NAME="qwen2.5-coder:1.5b"

echo ">> 🔄 Starting Ollama Server..."
# Background me server start karna padega taaki model pull kar sakein
ollama serve > /dev/null 2>&1 &
PID=$!

echo ">> ⏳ Waiting for Ollama to initialize (10 sec)..."
sleep 10

echo ">> 📥 Downloading AI Model: $MODEL_NAME"
echo ">> This might take time depending on internet speed..."
ollama pull $MODEL_NAME

# 6. Final Launch
echo -e "\033[1;32m"
echo "=========================================="
echo "   ✅ MobCloud Installation Complete! "
echo "   🚀 Model: $MODEL_NAME Ready."
echo "=========================================="
echo -e "\033[0m"

echo ">> Starting MobCloud Server..."
npm start

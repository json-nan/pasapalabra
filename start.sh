#!/bin/bash

echo "🎮 Iniciando Pasapalabra Streaming Game..."
echo "========================================"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

echo "🚀 Iniciando servidor..."
echo "Panel de Control: http://localhost:3000/panel-control.html?id=test"
echo "Widget OBS: http://localhost:3000/obs-widget.html?id=test"
echo "Modo Streaming: http://localhost:3000/obs-widget.html?id=test&streaming=true"
echo ""
echo "Presiona Ctrl+C para detener el servidor"
echo ""

node pasapalabra-server.js
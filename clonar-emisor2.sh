#!/bin/bash
# Clonar repo y configurar emisor con ID diferente

REPO_DIR="$1"

if [ -z "$REPO_DIR" ]; then
    echo "Uso: $0 <directorio_repo>"
    echo "Ejemplo: $0 /home/usuario/hackUPC_2026"
    exit 1
fi

if [ ! -d "$REPO_DIR" ]; then
    echo "ERROR: Directorio no existe: $REPO_DIR"
    exit 1
fi

cd "$REPO_DIR"

# Limpiar datos anteriores
rm -rf datos-biomesh-emisor

# Verificar que existe emisor.js
if [ ! -f "emisor.js" ]; then
    echo "ERROR: emisor.js no encontrado en $REPO_DIR"
    exit 1
fi

echo "=== EMISOR 2 CONFIGURADO ==="
echo ""
echo "Para iniciar este emisor en otra máquina:"
echo "  cd $REPO_DIR"
echo "  pear run emisor.js emisor-arduino-2"
echo ""
echo "El peerId sera: emisor-arduino-2"
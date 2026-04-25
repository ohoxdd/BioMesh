#!/bin/bash
# BioMeshP2P - Script de inicio rápido
# Uso: ./start.sh [emisor|observador|dashboard|all]

set -e

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

EMITOR_PID=""
OBS_PID=""
DASH_PID=""
EMISOR_OUT="/tmp/biomesh-emisor-out.txt"

cleanup() {
    echo ""
    echo "=== LIMPIEZA ==="
    [ -n "$EMISOR_PID" ] && kill $EMISOR_PID 2>/dev/null && echo "Emisor parado"
    [ -n "$OBS_PID" ] && kill $OBS_PID 2>/dev/null && echo "Observador parado"
    [ -n "$DASH_PID" ] && kill $DASH_PID 2>/dev/null && echo "Dashboard parado"
    echo "Limpieza completa"
}

trap cleanup EXIT INT TERM

case "${1:-all}" in
    emisor)
        echo "=== INICIANDO EMISOR ==="
        rm -rf datos-biomesh-emisor
        pear run emisor.js > "$EMISOR_OUT" 2>&1 &
        EMISOR_PID=$!
        echo "Emisor PID: $EMISOR_PID"
        echo "Output en: $EMISOR_OUT"
        sleep 2
        echo ""
        echo "Espera a que imprima la KEY:"
        echo "  grep '^=== KEY:' $EMISOR_OUT"
        echo ""
        tail -f "$EMISOR_OUT"
        ;;
        
    observador)
        echo "=== INICIANDO OBSERVADOR ==="
        rm -rf datos-biomesh-observador
        
        # Leer key del archivo o argumentos
        KEY=""
        if [ -n "$2" ]; then
            KEY="$2"
        elif [ -f "$EMISOR_OUT" ]; then
            KEY=$(grep "^=== KEY:" "$EMISOR_OUT" 2>/dev/null | awk '{print $3}')
        fi
        
        if [ -z "$KEY" ]; then
            echo "ERROR: No se encontró la key del emisor"
            echo "Ejecuta primero: ./start.sh emisor"
            echo "O pasa la key: ./start.sh observador <KEY>"
            exit 1
        fi
        
        echo "Key: $KEY"
        echo ""
        node observador.js "$KEY"
        ;;
        
    dashboard)
        echo "=== INICIANDO DASHBOARD ==="
        cd dashboard
        npm run dev &
        DASH_PID=$!
        echo "Dashboard PID: $DASH_PID"
        echo "Abriendo http://localhost:5173"
        tail -f /dev/null
        ;;
        
    all)
        echo "=== BIOMESHP2P - INICIANDO TODO ==="
        echo ""
        
        # 1. Emisor
        echo "1. Iniciando EMISOR (Pear)..."
        rm -rf datos-biomesh-emisor
        pear run emisor.js > "$EMISOR_OUT" 2>&1 &
        EMISOR_PID=$!
        sleep 8
        
        KEY=$(grep "^=== KEY:" "$EMISOR_OUT" 2>/dev/null | awk '{print $3}')
        if [ -z "$KEY" ]; then
            echo "ERROR: No se pudo obtener la key del emisor"
            exit 1
        fi
        echo "   Key: $KEY"
        
        # 2. Observador
        echo ""
        echo "2. Iniciando OBSERVADOR (Node.js)..."
        rm -rf datos-biomesh-observador
        node observador.js "$KEY" > /tmp/observador.log 2>&1 &
        OBS_PID=$!
        sleep 5
        
        # 3. Dashboard
        echo ""
        echo "3. Iniciando DASHBOARD (Vite)..."
        cd dashboard
        npm run dev > /dev/null 2>&1 &
        DASH_PID=$!
        cd ..
        
        echo ""
        echo "=== SISTEMA ARRANCADO ==="
        echo ""
        echo "Componentes activos:"
        [ -n "$EMISOR_PID" ] && echo "  - Emisor (Pear): PID $EMISOR_PID"
        [ -n "$OBS_PID" ] && echo "  - Observador (Node.js): PID $OBS_PID"
        [ -n "$DASH_PID" ] && echo "  - Dashboard: http://localhost:5173"
        echo ""
        echo "Archivos de log:"
        echo "  - Emisor: $EMISOR_OUT"
        echo "  - Observador: /tmp/observador.log"
        echo ""
        echo "Pulsa Ctrl+C para parar todo"
        echo ""
        
        # Mantener vivo y mostrar logs
        tail -f "$EMISOR_OUT" /tmp/observador.log 2>/dev/null || sleep 1000
        ;;
        
    stop)
        echo "=== PARANDO SISTEMA ==="
        pkill -f "pear run emisor" 2>/dev/null && echo "Emisor parado"
        pkill -f "node observador" 2>/dev/null && echo "Observador parado"
        pkill -f "vite" 2>/dev/null && echo "Dashboard parado"
        ;;
        
    status)
        echo "=== ESTADO DEL SISTEMA ==="
        echo ""
        echo "Procesos:"
        ps aux | grep -E "(pear run|node observador|vite)" | grep -v grep || echo "  Ninguno activo"
        echo ""
        echo "Datos:"
        [ -d datos-biomesh-emisor ] && echo "  - Emisor: datos-biomesh-emisor/"
        [ -d datos-biomesh-observador ] && echo "  - Observador: datos-biomesh-observador/"
        echo ""
        echo "Logs:"
        [ -f "$EMISOR_OUT" ] && tail -5 "$EMISOR_OUT"
        ;;
        
    *)
        echo "Uso: $0 {emisor|observador|dashboard|all|stop|status}"
        echo ""
        echo "Comandos:"
        echo "  emisor      - Iniciar solo el emisor (Pear)"
        echo "  observador  - Iniciar solo el observador (Node.js)"
        echo "  dashboard    - Iniciar solo el dashboard (Vite)"
        echo "  all          - Iniciar todo el sistema (default)"
        echo "  stop         - Parar todos los procesos"
        echo "  status       - Ver estado del sistema"
        exit 1
        ;;
esac
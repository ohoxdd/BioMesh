#!/bin/bash
# Script para probar el sistema completo

cd /home/hfern/Documents/stuff/HackUPC/hackUPC_2026
rm -rf datos-biomesh-*

echo "=== 1. Iniciando EMISOR ==="
pear run emisor.js &
EMISOR_PID=$!
sleep 8

echo ""
echo "=== 2. Leyendo key del emisor ==="
# Wait for key file or output
sleep 2

echo ""
echo "=== 3. Iniciando OBSERVADOR con la key ==="
# Get key from the running emisor output
# For now, let's start observador and hope it connects
node observador.js 2>&1 &
OBS_PID=$!
sleep 10

echo ""
echo "=== 4. Test WebSocket ==="
node -e "
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:8080');
ws.on('open', () => console.log('[WS] Conectado'));
ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    console.log('[WS] DATOS:', JSON.stringify(msg).substring(0, 100));
    ws.close();
});
ws.on('error', (err) => console.error('[WS] Error:', err.message));
setTimeout(() => { console.log('[WS] Timeout'); ws.close(); }, 5000);
"

echo ""
echo "=== LIMPIEZA ==="
kill $EMISOR_PID $OBS_PID 2>/dev/null
echo "Done"
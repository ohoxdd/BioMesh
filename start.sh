#!/bin/bash
# BioMeshP2P - launcher
# Uso: ./start.sh {emisor1|emisor2|emisor3|observador|dashboard|all|multi|local|stop|status|clean}

set -e

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

E1_LOG="/tmp/biomesh-emisor1.log"
E2_LOG="/tmp/biomesh-emisor2.log"
E3_LOG="/tmp/biomesh-emisor3.log"
OBS_LOG="/tmp/biomesh-observador.log"
DASH_LOG="/tmp/biomesh-dashboard.log"

E1_PID=""; E2_PID=""; E3_PID=""; OBS_PID=""; DASH_PID=""

cleanup() {
    echo ""
    echo "=== CLEANUP ==="
    [ -n "$E1_PID" ] && kill $E1_PID 2>/dev/null && echo "Emisor1 stop"
    [ -n "$E2_PID" ] && kill $E2_PID 2>/dev/null && echo "Emisor2 stop"
    [ -n "$E3_PID" ] && kill $E3_PID 2>/dev/null && echo "Emisor3 stop"
    [ -n "$OBS_PID" ] && kill $OBS_PID 2>/dev/null && echo "Observador stop"
    [ -n "$DASH_PID" ] && kill $DASH_PID 2>/dev/null && echo "Dashboard stop"
    pkill -f "pear run emisor" 2>/dev/null || true
    pkill -f "node observador" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

extract_key() {
    local log=$1
    grep "^=== KEY:" "$log" 2>/dev/null | head -1 | awk '{print $3}'
}

wait_for_key() {
    local log=$1
    local tries=0
    while [ $tries -lt 30 ]; do
        local k=$(extract_key "$log")
        if [ -n "$k" ]; then echo "$k"; return 0; fi
        sleep 1
        tries=$((tries+1))
    done
    return 1
}

case "${1:-multi}" in
    emisor1|emisor)
        echo "=== EMISOR 1 (creator) ==="
        rm -rf datos-biomesh-emisor-arduino-1
        pear run emisor.js emisor-arduino-1 | tee "$E1_LOG"
        ;;

    emisor2)
        KEY="$2"
        if [ -z "$KEY" ]; then KEY=$(extract_key "$E1_LOG"); fi
        if [ -z "$KEY" ]; then echo "ERROR: need KEY (arg or run emisor1 first)"; exit 1; fi
        echo "=== EMISOR 2 ==="
        echo "KEY: $KEY"
        rm -rf datos-biomesh-emisor-arduino-2
        pear run emisor.js emisor-arduino-2 "$KEY" | tee "$E2_LOG"
        ;;

    emisor3)
        KEY="$2"
        if [ -z "$KEY" ]; then KEY=$(extract_key "$E1_LOG"); fi
        if [ -z "$KEY" ]; then echo "ERROR: need KEY (arg or run emisor1 first)"; exit 1; fi
        echo "=== EMISOR 3 ==="
        echo "KEY: $KEY"
        rm -rf datos-biomesh-emisor-arduino-3
        pear run emisor.js emisor-arduino-3 "$KEY" | tee "$E3_LOG"
        ;;

    observador)
        KEY="$2"
        if [ -z "$KEY" ]; then KEY=$(extract_key "$E1_LOG"); fi
        if [ -z "$KEY" ]; then echo "ERROR: need KEY (arg or run emisor1 first)"; exit 1; fi
        echo "=== OBSERVADOR ==="
        echo "KEY: $KEY"
        rm -rf datos-biomesh-observador
        node observador.js "$KEY"
        ;;

    dashboard)
        echo "=== DASHBOARD ==="
        cd dashboard && npm run dev
        ;;

    multi|all|3emisores)
        echo "=== BIOMESHP2P MULTI (3 emisores + obs + dashboard) ==="
        echo ""

        # cleanup data dirs
        rm -rf datos-biomesh-* /tmp/biomesh-derive-* 2>/dev/null || true

        # 1. Emisor 1 (creator)
        echo "[1/5] Emisor 1 (creator)..."
        nohup pear run emisor.js emisor-arduino-1 > "$E1_LOG" 2>&1 &
        E1_PID=$!
        echo "  PID: $E1_PID, log: $E1_LOG"

        KEY=$(wait_for_key "$E1_LOG")
        if [ -z "$KEY" ]; then
            echo "ERROR: no KEY from emisor1"
            tail -30 "$E1_LOG"
            exit 1
        fi
        echo "  KEY: $KEY"
        sleep 5

        # 2. Observador
        echo ""
        echo "[2/5] Observador..."
        nohup node observador.js "$KEY" > "$OBS_LOG" 2>&1 &
        OBS_PID=$!
        echo "  PID: $OBS_PID, log: $OBS_LOG"
        sleep 5

        # 3. Emisor 2
        echo ""
        echo "[3/5] Emisor 2..."
        nohup pear run emisor.js emisor-arduino-2 "$KEY" > "$E2_LOG" 2>&1 &
        E2_PID=$!
        echo "  PID: $E2_PID, log: $E2_LOG"
        sleep 3

        # 4. Emisor 3
        echo ""
        echo "[4/5] Emisor 3..."
        nohup pear run emisor.js emisor-arduino-3 "$KEY" > "$E3_LOG" 2>&1 &
        E3_PID=$!
        echo "  PID: $E3_PID, log: $E3_LOG"
        sleep 3

        # 5. Dashboard
        echo ""
        echo "[5/5] Dashboard..."
        (cd dashboard && nohup npm run dev > "$DASH_LOG" 2>&1 &)
        sleep 3

        echo ""
        echo "=== READY ==="
        echo "  Dashboard:    http://localhost:5173"
        echo "  WS Observer:  ws://localhost:8080"
        echo "  Base KEY:     $KEY"
        echo ""
        echo "Logs:"
        echo "  Emisor1:    $E1_LOG"
        echo "  Emisor2:    $E2_LOG"
        echo "  Emisor3:    $E3_LOG"
        echo "  Observador: $OBS_LOG"
        echo "  Dashboard:  $DASH_LOG"
        echo ""
        echo "Tail combined RX (Ctrl+C to stop):"
        echo ""
        tail -f "$OBS_LOG" 2>/dev/null
        ;;

    local)
        # Same as multi but explicit
        exec "$0" multi
        ;;

    stop)
        echo "=== STOP ==="
        pkill -f "pear run emisor" 2>/dev/null && echo "emisores stop" || echo "no emisores"
        pkill -f "node observador" 2>/dev/null && echo "obs stop" || echo "no obs"
        pkill -f "vite" 2>/dev/null && echo "dashboard stop" || echo "no dash"
        ;;

    status)
        echo "=== STATUS ==="
        ps aux | grep -E "(pear run emisor|node observador|vite)" | grep -v grep || echo "  none"
        echo ""
        if [ -f "$E1_LOG" ]; then
            KEY=$(extract_key "$E1_LOG")
            [ -n "$KEY" ] && echo "Last KEY: $KEY"
        fi
        ;;

    clean)
        echo "=== CLEAN ==="
        rm -rf datos-biomesh-* /tmp/biomesh-derive-* 2>/dev/null
        rm -f /tmp/biomesh-*.log 2>/dev/null
        echo "data dirs + logs wiped"
        ;;

    key)
        KEY=$(extract_key "$E1_LOG")
        [ -n "$KEY" ] && echo "$KEY" || { echo "no key found"; exit 1; }
        ;;

    *)
        cat <<EOF
Usage: $0 {emisor1|emisor2|emisor3|observador|dashboard|multi|stop|status|clean|key}

Single procs:
  emisor1            Start emisor 1 (creator). Always run first.
  emisor2 [KEY]      Start emisor 2. KEY auto-read from emisor1 log if omitted.
  emisor3 [KEY]      Start emisor 3.
  observador [KEY]   Start observador + WS server (port 8080).
  dashboard          Start Vite dev server (port 5173).

Combined:
  multi              Start everything: 3 emisores + obs + dashboard. Default.
  stop               Kill all biomesh procs.
  status             Show running procs + last KEY.
  clean              Wipe data dirs + logs.
  key                Print last base KEY from emisor1 log.

Multi-machine:
  Machine A: ./start.sh emisor1   → copy KEY printed
  Machine B: ./start.sh emisor2 <KEY>
  Machine C: ./start.sh emisor3 <KEY>
  Machine X: ./start.sh observador <KEY>  + ./start.sh dashboard
EOF
        exit 1
        ;;
esac

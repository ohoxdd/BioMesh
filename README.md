# BioMeshP2P

Proyecto P2P basado en Arduino UNO Q junto con el stack de Pear para monitorizar calidad del aire, temperaturas y métricas medioambientales en Barcelona, ayudando a cuidar la biodiversidad y la salud de las personas.

## Arquitectura

- **3 emisores** (`emisor-arduino-1/2/3`) con `peerId` único, claves deterministas y replica via Hyperswarm + Autobase.
- **1 observador** que recibe los datos linealizados y los reenvía por WebSocket (`ws://localhost:8080`).
- **1 dashboard** React/Vite que consume el WebSocket y renderiza por `peerId`.

```
[Emisor 1] [Emisor 2] [Emisor 3]
        \      |      /
         Hyperswarm DHT (Autobase multi-writer)
                |
          [Observador] ── WS:8080 ──► [Dashboard:5173]
```

## Setup

```bash
npm install
cd dashboard && npm install && cd ..
```

## Quick Start

```bash
./start.sh multi
# o
npm run start:multi
```

Lanza 3 emisores + observador + dashboard. Abre **http://localhost:5173**.

## Comandos

```bash
./start.sh emisor1                # creator, primero siempre
./start.sh emisor2 [KEY]
./start.sh emisor3 [KEY]
./start.sh observador [KEY]
./start.sh dashboard
./start.sh multi                  # todo en background
./start.sh stop|status|clean|key
```

## Multi-máquina

```bash
# Máquina A
./start.sh emisor1
# Copia el KEY mostrado

# Máquina B
./start.sh emisor2 <KEY>

# Máquina C
./start.sh emisor3 <KEY>

# Máquina X (observador + dashboard)
./start.sh observador <KEY> &
./start.sh dashboard
```

## Documentación

- [`MANUAL_TESTING.md`](MANUAL_TESTING.md) — Guía completa de testing
- [`ARQUITECTURA_P2P.md`](ARQUITECTURA_P2P.md) — Arquitectura P2P
- [`FLUJO_DE_EJECUCION.md`](FLUJO_DE_EJECUCION.md) — Flujo de ejecución

# Manual de Testing - BioMeshP2P

## Requisitos Previos

- Node.js instalado
- Pear instalado (`npm install -g pear`)
- Dependencias del proyecto instaladas (`npm install`)

## Instalación

```bash
cd /home/hfern/Documents/stuff/HackUPC/hackUPC_2026
npm install
cd dashboard && npm install && cd ..
```

---

## Uso Rápido (3 comandos)

### 1. Iniciar todo el sistema

```bash
cd /home/hfern/Documents/stuff/HackUPC/hackUPC_2026
./start.sh all
```

Esto iniciara automaticamente:
- Emisor (Pear) - genera datos	mock
- Observador (Node.js) - recibe y reenvia
- Dashboard (Vite) - visualizacion web

Abre tu navegador: **http://localhost:5173**

---

## Uso Individual

Si prefieres controlar cada componente por separado:

### Terminal 1 - Emisor (Primero)

```bash
cd /home/hfern/Documents/stuff/HackUPC/hackUPC_2026
./start.sh emisor
```

Veras un output como:
```
=== KEY: 51f5fa69c41134e160f5d9c85445e9d7bf91b4a2f9cff999fb8ea412fd53730e ===
Writable: true
>>> ENVIADO: 26.3 °C
```

**Copia la key** (la cadena de 64 caracteres entre `=== KEY:` y `===`)

### Terminal 2 - Observador

```bash
cd /home/hfern/Documents/stuff/HackUPC/hackUPC_2026
./start.sh observador <KEY>
```

Reemplaza `<KEY>` con la key que copiaste del emisor.

Ejemplo:
```bash
./start.sh observador 51f5fa69c41134e160f5d9c85445e9d7bf91b4a2f9cff999fb8ea412fd53730e
```

Deberias ver:
```
Usando ws (Node.js)
Usando key: 51f5fa...
=== KEY: 51f5fa... ===
Dashboard Web conectado
OBSERVADOR: peer conectado
>>> RECIBIDO: {"peerId":"emisor-arduino-1",...}
```

### Terminal 3 - Dashboard

```bash
cd /home/hfern/Documents/stuff/HackUPC/hackUPC_2026/dashboard
npm run dev
```

Abre: **http://localhost:5173**

---

## Verificar que Funciona

### 1. Emisor

En la terminal del emisor, deberias ver:
```
>>> ENVIADO: 25.4 °C
>>> ENVIADO: 28.9 °C
```

### 2. Observador

En la terminal del observador, deberias ver:
```
>>> RECIBIDO: {"peerId":"emisor-arduino-1","temperature":25.4,...}
Dashboard Web conectado
```

### 3. Dashboard

En el navegador veras:
- Mapa con marcador en Barcelona
- Grafico de temperatura
- Grafico de humedad
- Otros graficos

---

## Comandos Utiles

### Ver estado

```bash
./start.sh status
```

Muestra los procesos activos y archivos de datos.

### Parar todo

```bash
./start.sh stop
```

O simplemente Ctrl+C en el terminal donde ejecutaste `./start.sh all`

### Limpiar datos

```bash
cd /home/hfern/Documents/stuff/HackUPC/hackUPC_2026
rm -rf datos-biomesh-*
```

---

## Estructura de Datos

El emisor genera datos en este formato:

```json
{
  "peerId": "emisor-arduino-1",
  "timestamp": 1777154211340,
  "location": [41.3878, 2.1596],
  "lat": 41.3878,
  "lng": 2.1596,
  "temperature": 29.4,
  "humidity": 35,
  "wind": 18,
  "light": 788.6,
  "airQuality": 8.6
}
```

---

## Solucion de Problemas

### Puerto 8080 en uso

```bash
lsof -ti:8080 | xargs -r kill -9
./start.sh all
```

### El dashboard no muestra datos

1. Verifica que el observador esta corriendo:
```bash
./start.sh status
```

2. Prueba WebSocket manualmente:
```bash
node -e "
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:8080');
ws.on('open', () => console.log('WS conectado'));
ws.on('message', (data) => console.log('Datos:', data.toString().substring(0,100)));
ws.on('error', (e) => console.error('Error:', e.message));
setTimeout(() => ws.close(), 3000);
"
```

### El observador no conecta al emisor

1. Verifica que la key es correcta (64 caracteres)
2. Verifica que el emisor esta corriendo
3. Mira los logs en `/tmp/biomesh-emisor-out.txt`

---

## Flujo de Datos

```
emisor.js
    │
    ├─> genera datos (helper.js)
    │
    ├─> Autobase.append(JSON.stringify(data))
    │
    └─> Hyperswarm replication
            │
            ▼
observador.js
    │
    ├─> Autobase.apply() recibe datos
    │
    ├─> broadcast() envia al WebSocket
    │
    └─> WebSocket (puerto 8080)
            │
            ▼
dashboard/App.jsx
    │
    ├─> onmessage() recibe JSON
    │
    ├─> setDataHistory()
    │
    └─> Charts.jsx renderiza graficos
```

---

## Scripts NPM

Tambien puedes usar npm scripts:

```bash
# Todo
npm start

# Solo emisor
npm run emisor

# Solo observador (necesita key como argumento)
npm run observador <KEY>

# Solo dashboard
npm run dashboard
```
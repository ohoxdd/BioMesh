// Intentar usar ws de Node.js, fallback a bare-ws
let WebSocket, wssFunction;
let isNodeWs = false;

try {
  WebSocket = require('ws');
  wssFunction = WebSocket.Server;
  isNodeWs = true;
  console.log('Usando ws (Node.js)');
} catch(e) {
  WebSocket = require('bare-ws');
  wssFunction = WebSocket.Server;
  isNodeWs = false;
  console.log('Usando bare-ws (Pear)');
}

const DHT = require('hyperdht');
const Corestore = require('corestore');
const Autobase = require('autobase');
const Hyperswarm = require('hyperswarm');

// WebSocket server para el dashboard
const wss = new wssFunction({ port: 8080 });
const clients = new Set();

wss.on('connection', (ws) => {
  console.log('Dashboard Web conectado');
  clients.add(ws);
  ws.on('close', () => {
    console.log('Dashboard Web desconectado');
    clients.delete(ws);
  });
});

function broadcast(data) {
  const msg = JSON.stringify(data);
  for (const client of clients) {
    if (isNodeWs) {
      // ws (Node.js): use send()
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    } else {
      // bare-ws (Pear): use write()
      if (client.ready) {
        client.write(msg);
      }
    }
  }
}

// Leer key - soporte tanto para Pear como Node.js
let BASE_KEY = null;

//Desde Pear config
if (typeof Pear !== 'undefined' && Pear.config.args && Pear.config.args.length > 0) {
  BASE_KEY = Pear.config.args[0];
} 
// Desde argumentos de línea de comandos (process.argv)
else if (typeof process !== 'undefined' && process.argv && process.argv.length > 2) {
  BASE_KEY = process.argv[2];
}

async function conectar() {
  const store = new Corestore('./datos-biomesh-observador');

  async function apply(nodes, view, host) {
    for (const node of nodes) {
      if (node.value.addWriter) {
        console.log('OBSERVADOR: Añadiendo writer');
        await host.addWriter(node.value.addWriter, { isIndexer: true });
      } else {
        const strValue = node.value.toString();
        console.log('>>> RECIBIDO:', strValue);
        try {
          const data = JSON.parse(strValue);
          broadcast(data);
        } catch(e) {
          broadcast({ raw: strValue });
        }
      }
    }
  }

  let base;
  if (BASE_KEY) {
    console.log('Usando key:', BASE_KEY);
    const keyBuffer = Buffer.from(BASE_KEY, 'hex');
    base = new Autobase(store, keyBuffer, { apply });
    await base.ready();
  } else {
    console.log('Creando nueva base');
    base = new Autobase(store, null, { apply });
    await base.ready();
  }

  console.log('=== KEY:', base.key.toString('hex'), '===');
  console.log('Writable:', base.writable);

  const swarm = new Hyperswarm();
  swarm.join(base.discoveryKey);

  swarm.on('connection', (socket) => {
    console.log('OBSERVADOR: peer conectado');
    store.replicate(socket);
  });

  setInterval(async () => {
    await base.update();
  }, 3000);
}

conectar();

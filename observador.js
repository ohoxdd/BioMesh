const DHT = require('hyperdht');
const process = require('bare-process');
const Corestore = require('corestore');
const Autobase = require('autobase');
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });
const clients = new Set();

wss.on('connection', (ws) => {
  console.log('Cliente Web conectado al Dashboard');
  clients.add(ws);
  ws.on('close', () => clients.delete(ws));
});

function broadcastData(data) {
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  }
}

const publicKeyHex = '8aaf76507b4a61d11f48ce7e126af835b377f5c715227e3306d5a3639238a99c';
const publicKey = Buffer.from(publicKeyHex, 'hex');

const autobaseKeyHex = '627f61c7f6a9394688c08ecdede8f9a9107323cb52838fc70d366a34bded5740'
const autobaseKey = Buffer.from(autobaseKeyHex, 'hex');

async function conectar() {
  // 1. Directorio de almacenamiento para el ordenador
  const store = new Corestore('./datos-biomesh-observador');

  // 2. Función apply() para leer los bloques que nos llegan del Arduino 
  async function apply(nodes, view, host) {
    for (const node of nodes) {
       const strValue = node.value.toString();
       console.log('EVENTO RECIBIDO DE LA RED:', strValue);
       try {
           const parsedData = JSON.parse(strValue);
           broadcastData(parsedData);
       } catch(e) {
           // Si no es JSON válido, lo enviamos como texto plano
           broadcastData({ raw: strValue });
       }
    }
  }

  const base = new Autobase(store, autobaseKey, { apply });
  await base.ready();

  const node = new DHT();
  const socket = node.connect(publicKey);

  socket.on('open', function () {
    console.log('Túnel perforado. Sincronizando registros inmutables...');
    // Iniciamos la sincronización de los registros 
    store.replicate(socket);

	  setInterval(async () => {
		  await base.update();
	  }, 1000);
  });

  socket.on('error', function (err) {
    console.error('Fallo en la conexión P2P:', err.code);
  });
}

conectar();

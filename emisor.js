const DHT = require('hyperdht');
const process = require('bare-process');
const Corestore = require('corestore');
const Autobase = require('autobase');

async function iniciarNodo() {
  // 1. Inicializar Corestore (Almacenamiento local)
  const store = new Corestore('./datos-biomesh-emisor');

  // 2. Definir la función determinista apply()
  // Esta función procesa el historial inmutable linealizado de la red 
  async function apply(nodes, view, host) {
    for (const node of nodes) {
      console.log('Historial P2P actualizado:', node.value.toString());
    }
  }

  // Envolver Corestore con Autobase 
  const base = new Autobase(store, null, { apply });
  await base.ready();
  console.log('Clave Autobase (Copia esto también):', base.key.toString('hex'));

  const node = new DHT();
  const server = node.createServer();

  server.on('connection', function (socket) {
    console.log('¡Conexión P2P establecida! Sincronizando base de datos...');
    // Replicamos la base de datos a través del túnel seguro 
    store.replicate(socket);
  });

  const keyPair = DHT.keyPair();
  await server.listen(keyPair);
  
  console.log('Arduino esperando conexiones P2P...');
  console.log('Clave Pública (Copia esto):', keyPair.publicKey.toString('hex'));

  // Inyección de alertas falsas (Simulando el modelo de IA)
  setInterval(async () => {
     const alerta = `ALERTA AMBIENTAL: Temperatura crítica detectada a las ${new Date().toLocaleTimeString()}`;
     await base.append(alerta); // Agrega el evento a la cadena 
     console.log('Evento inyectado localmente.');
  }, 10000);
}

iniciarNodo();

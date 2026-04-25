import React, { useState, useEffect, useMemo } from 'react';
import { Wifi } from 'lucide-react';
import P2PMap from './components/Map';
import P2PCharts from './components/Charts';

const MAX_HISTORY = 200;

function App() {
  const [connected, setConnected] = useState(false);
  const [peersData, setPeersData] = useState([]);
  const [dataHistory, setDataHistory] = useState([]);
  const [selectedPeer, setSelectedPeer] = useState('all');

  useEffect(() => {
    let ws;
    let cancelled = false;

    const connectWS = () => {
      ws = new WebSocket('ws://localhost:8080');

      ws.onopen = () => {
        console.log('Connected to BioMeshP2P observer');
        setConnected(true);
      };

      ws.onclose = () => {
        console.log('Disconnected. Reconnecting in 3s...');
        setConnected(false);
        if (!cancelled) setTimeout(connectWS, 3000);
      };

      ws.onerror = (e) => {
        console.error('WS Error:', e);
        try { ws.close(); } catch(_) {}
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (!data.timestamp) data.timestamp = Date.now();

          // Latest snapshot per peer (for map + stat cards)
          setPeersData(prev => {
            const peerId = data.peerId || 'unknown';
            const filtered = prev.filter(p => (p.peerId || 'unknown') !== peerId);
            return [...filtered, data];
          });

          // Append to history
          setDataHistory(prev => {
            const next = [...prev, data];
            if (next.length > MAX_HISTORY) return next.slice(next.length - MAX_HISTORY);
            return next;
          });
        } catch (e) {
          console.error('Error parsing WS message', e);
        }
      };
    };

    connectWS();
    return () => {
      cancelled = true;
      try { if (ws) { ws.onclose = null; ws.close(); } } catch(_) {}
    };
  }, []);

  // Sorted unique peer list (stable order)
  const peers = useMemo(() => {
    const set = new Set();
    for (const d of dataHistory) if (d.peerId) set.add(d.peerId);
    return Array.from(set).sort();
  }, [dataHistory]);

  const latestData = dataHistory.length > 0 ? dataHistory[dataHistory.length - 1] : null;

  return (
    <div className="dashboard-container">
      <header>
        <h1>BioMeshP2P Monitoring</h1>
        <div className="status-indicator">
          <div className={`status-dot ${connected ? '' : 'disconnected'}`}></div>
          {connected ? 'Autobase Sincronizado' : 'Buscando Peers...'}
        </div>
      </header>

      <div className="grid-layout">
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel">
            <h3 className="panel-title"><Wifi size={20} color="#3b82f6" /> Estado Global</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-label">Sensores Activos</span>
                <span className="stat-value">{peersData.length}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Mensajes Totales</span>
                <span className="stat-value">{dataHistory.length}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Última Actualización</span>
                <span className="stat-value" style={{ fontSize: '1rem', color: '#e2e8f0' }}>
                  {latestData ? new Date(latestData.timestamp).toLocaleTimeString() : '--:--'}
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Filtro Activo</span>
                <span className="stat-value" style={{ fontSize: '0.95rem', color: '#e2e8f0' }}>
                  {selectedPeer === 'all' ? 'Todos' : selectedPeer}
                </span>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '0.5rem', height: '100%' }}>
            <P2PMap peersData={peersData} />
          </div>
        </div>

        {/* Right column: Charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: 0 }}>
            <P2PCharts
              dataHistory={dataHistory}
              peers={peers}
              selectedPeer={selectedPeer}
              onSelectPeer={setSelectedPeer}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

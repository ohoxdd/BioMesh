import React, { useState, useEffect } from 'react';
import { Wifi, Activity } from 'lucide-react';
import P2PMap from './components/Map';
import P2PCharts from './components/Charts';

function App() {
  const [connected, setConnected] = useState(false);
  const [peersData, setPeersData] = useState([]);
  const [dataHistory, setDataHistory] = useState([]);

  useEffect(() => {
    // Connect to local observador.js websocket
    const connectWS = () => {
        const ws = new WebSocket('ws://localhost:8080');

        ws.onopen = () => {
          console.log('Connected to P2P EdgeIA backend');
          setConnected(true);
        };

        ws.onclose = () => {
          console.log('Disconnected from backend. Reconnecting in 3s...');
          setConnected(false);
          setTimeout(connectWS, 3000);
        };

        ws.onerror = (e) => {
            console.error('WS Error:', e);
            ws.close();
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('New data from P2P:', data);
            
            // Ensure timestamp exists
            if (!data.timestamp) data.timestamp = Date.now();
            
            // Update current peers location and latest data
            setPeersData(prev => {
              const peerId = data.peerId || 'unknown';
              const filtered = prev.filter(p => (p.peerId || 'unknown') !== peerId);
              return [...filtered, data];
            });

            // Add to history for charts (keep last 50 points to avoid memory bloat)
            setDataHistory(prev => {
              const newHistory = [...prev, data];
              if (newHistory.length > 50) return newHistory.slice(newHistory.length - 50);
              return newHistory;
            });

          } catch (e) {
            console.error('Error parsing WS message', e);
          }
        };
        
        return ws;
    };
    
    const ws = connectWS();

    return () => {
        ws.onclose = null; // prevent reconnect on unmount
        ws.close()
    };
  }, []);

  const latestData = dataHistory.length > 0 ? dataHistory[dataHistory.length - 1] : null;

  return (
    <div className="dashboard-container">
      <header>
        <h1>EdgeIA P2P Network</h1>
        <div className="status-indicator">
          <div className={`status-dot ${connected ? '' : 'disconnected'}`}></div>
          {connected ? 'Autobase Sincronizado' : 'Buscando Peers...'}
        </div>
      </header>

      <div className="grid-layout">
        {/* Left column: Overview & Map */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel">
            <h3 className="panel-title"><Wifi size={20} color="#3b82f6"/> Estado Global</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-label">Nodos Activos</span>
                <span className="stat-value">{peersData.length}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Última Actualización</span>
                <span className="stat-value" style={{ fontSize: '1rem', color: '#e2e8f0' }}>
                  {latestData ? new Date(latestData.timestamp).toLocaleTimeString() : '--:--'}
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
             <P2PCharts dataHistory={dataHistory} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

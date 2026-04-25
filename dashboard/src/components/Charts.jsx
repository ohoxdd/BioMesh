import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity, Droplets, Wind, AlertTriangle, Sun } from 'lucide-react';

const PEER_COLORS = {
  'emisor-arduino-1': '#ef4444', // red
  'emisor-arduino-2': '#3b82f6', // blue
  'emisor-arduino-3': '#10b981', // green
};
const FALLBACK_COLORS = ['#a855f7', '#eab308', '#06b6d4', '#f97316', '#ec4899'];

function colorFor(peerId, idx) {
  return PEER_COLORS[peerId] || FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
}

const formatTime = (tickItem) => {
  if (!tickItem) return '';
  const date = new Date(tickItem);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
};

/**
 * Pivot dataHistory ([{peerId, timestamp, temperature, ...}]) into row format:
 *   [{timestamp, [`temp_${peerId}`]: value, ...}]
 * Each timestamp = one row. Multiple peers may share row if same ts (rare).
 */
function pivotByPeer(dataHistory, metric, peers) {
  const rows = [];
  for (const d of dataHistory) {
    if (!d || !d.peerId || d[metric] === undefined) continue;
    if (peers && !peers.includes(d.peerId)) continue;
    rows.push({
      timestamp: d.timestamp,
      [d.peerId]: d[metric],
    });
  }
  return rows;
}

function ChartPanel({ title, icon, dataHistory, metric, yDomain, peers, selectedPeer }) {
  const visiblePeers = selectedPeer === 'all'
    ? peers
    : peers.filter(p => p === selectedPeer);

  const data = useMemo(() => pivotByPeer(dataHistory, metric, visiblePeers), [dataHistory, metric, visiblePeers]);

  return (
    <div className="glass-panel">
      <h3 className="panel-title">{icon} {title}</h3>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="timestamp" tickFormatter={formatTime} stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" domain={yDomain || ['dataMin - 2', 'dataMax + 2']} />
            <Tooltip
              labelFormatter={formatTime}
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            <Legend wrapperStyle={{ color: '#cbd5e1', fontSize: 12 }} />
            {visiblePeers.map((peer, idx) => (
              <Line
                key={peer}
                type="monotone"
                dataKey={peer}
                name={peer}
                stroke={colorFor(peer, idx)}
                strokeWidth={2.5}
                dot={false}
                connectNulls={true}
                activeDot={{ r: 6 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function P2PCharts({ dataHistory, peers, selectedPeer, onSelectPeer }) {
  const peerList = peers && peers.length ? peers : Array.from(new Set(dataHistory.map(d => d.peerId).filter(Boolean)));

  return (
    <>
      <div className="glass-panel peer-selector">
        <h3 className="panel-title"><Activity size={18} color="#06b6d4" /> Filtrar Sensor</h3>
        <div className="peer-buttons">
          <button
            className={`peer-btn ${selectedPeer === 'all' ? 'active' : ''}`}
            onClick={() => onSelectPeer('all')}
            style={{ '--peer-color': '#06b6d4' }}
          >
            Todos ({peerList.length})
          </button>
          {peerList.map((peer, idx) => (
            <button
              key={peer}
              className={`peer-btn ${selectedPeer === peer ? 'active' : ''}`}
              onClick={() => onSelectPeer(peer)}
              style={{ '--peer-color': colorFor(peer, idx) }}
            >
              <span className="peer-dot" style={{ background: colorFor(peer, idx) }}></span>
              {peer}
            </button>
          ))}
        </div>
      </div>

      <div className="charts-grid">
        <ChartPanel
          title="Temperatura (°C)"
          icon={<Activity size={20} color="#ef4444" />}
          dataHistory={dataHistory}
          metric="temperature"
          peers={peerList}
          selectedPeer={selectedPeer}
        />
        <ChartPanel
          title="Humedad (%)"
          icon={<Droplets size={20} color="#3b82f6" />}
          dataHistory={dataHistory}
          metric="humidity"
          yDomain={[0, 100]}
          peers={peerList}
          selectedPeer={selectedPeer}
        />
        <ChartPanel
          title="Viento (km/h)"
          icon={<Wind size={20} color="#10b981" />}
          dataHistory={dataHistory}
          metric="wind"
          peers={peerList}
          selectedPeer={selectedPeer}
        />
        <ChartPanel
          title="Luz (lux)"
          icon={<Sun size={20} color="#eab308" />}
          dataHistory={dataHistory}
          metric="light"
          peers={peerList}
          selectedPeer={selectedPeer}
        />
        <div style={{ gridColumn: '1 / -1' }}>
          <ChartPanel
            title="Calidad del Aire"
            icon={<AlertTriangle size={20} color="#f59e0b" />}
            dataHistory={dataHistory}
            metric="airQuality"
            peers={peerList}
            selectedPeer={selectedPeer}
          />
        </div>
      </div>
    </>
  );
}

export { PEER_COLORS, colorFor };

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Droplets, Wind, AlertTriangle, Sun } from 'lucide-react';

const formatTime = (tickItem) => {
  if (!tickItem) return '';
  const date = new Date(tickItem);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
};

export default function P2PCharts({ dataHistory }) {
  // Use dataHistory directly, assume it has properties like temp, hum, wind, air
  return (
    <div className="charts-grid">
      <div className="glass-panel">
        <h3 className="panel-title"><Activity size={20} color="#ef4444" /> Temperatura (°C)</h3>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dataHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="timestamp" tickFormatter={formatTime} stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip labelFormatter={formatTime} />
              <Line type="monotone" dataKey="temperature" name="Temp" stroke="#ef4444" strokeWidth={3} dot={false} activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="temp" name="Temp" stroke="#ef4444" strokeWidth={3} dot={false} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-panel">
        <h3 className="panel-title"><Droplets size={20} color="#3b82f6" /> Humedad (%)</h3>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dataHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="timestamp" tickFormatter={formatTime} stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" domain={[0, 100]} />
              <Tooltip labelFormatter={formatTime} />
              <Line type="monotone" dataKey="humidity" name="Humedad" stroke="#3b82f6" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="hum" name="Humedad" stroke="#3b82f6" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-panel">
        <h3 className="panel-title"><Wind size={20} color="#10b981" /> Viento (km/h)</h3>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dataHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="timestamp" tickFormatter={formatTime} stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip labelFormatter={formatTime} />
              <Line type="monotone" dataKey="wind" name="Viento" stroke="#10b981" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-panel">
        <h3 className="panel-title"><Sun size={20} color="#eab308" /> Luz (lux)</h3>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dataHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="timestamp" tickFormatter={formatTime} stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip labelFormatter={formatTime} />
              <Line type="monotone" dataKey="light" name="Luz" stroke="#eab308" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="glass-panel" style={{ gridColumn: '1 / -1' }}>
        <h3 className="panel-title"><AlertTriangle size={20} color="#f59e0b" /> Calidad del Aire</h3>
        <div className="chart-wrapper" style={{ height: '200px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dataHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="timestamp" tickFormatter={formatTime} stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip labelFormatter={formatTime} />
              <Line type="monotone" dataKey="airQuality" name="Calidad Aire" stroke="#f59e0b" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="air" name="Calidad Aire" stroke="#f59e0b" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}

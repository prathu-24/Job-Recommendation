import React, { useState } from 'react';
import { Truck, AlertTriangle, ShieldCheck, MapPin, ZoomIn, ZoomOut, RefreshCw, Send, Sparkles } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface Driver {
  id: string;
  name: string;
  vehicle: string;
  status: 'Active' | 'Delayed' | 'Stopped';
  health: 'Normal' | 'Warning' | 'Critical';
  route: string;
  destination: string;
  lastUpdated: string;
}

const initialDrivers: Driver[] = [
  { id: '1', name: 'Marcus Vance', vehicle: 'TRK-902', status: 'Active', health: 'Normal', route: 'Seattle, WA', destination: 'Chicago, IL', lastUpdated: '3m ago' },
  { id: '2', name: 'Elena Rostova', vehicle: 'TRK-415', status: 'Delayed', health: 'Warning', route: 'Denver, CO', destination: 'Dallas, TX', lastUpdated: '12m ago' },
  { id: '3', name: 'Devon Miller', vehicle: 'TRK-108', status: 'Active', health: 'Normal', route: 'Miami, FL', destination: 'Atlanta, GA', lastUpdated: '1m ago' },
  { id: '4', name: 'Sarah Jenkins', vehicle: 'TRK-774', status: 'Stopped', health: 'Critical', route: 'Boston, MA', destination: 'New York, NY', lastUpdated: '34m ago' },
  { id: '5', name: 'Kenji Sato', vehicle: 'TRK-303', status: 'Active', health: 'Normal', route: 'San Francisco, CA', destination: 'Los Angeles, CA', lastUpdated: '5m ago' },
  { id: '6', name: 'Aaliyah Jackson', vehicle: 'TRK-582', status: 'Delayed', health: 'Warning', route: 'Houston, TX', destination: 'New Orleans, LA', lastUpdated: '18m ago' },
];

// Sparkline datasets (stark high-contrast style)
const successRateData = [
  { value: 94 }, { value: 95 }, { value: 93 }, { value: 96 },
  { value: 97 }, { value: 95 }, { value: 98 }, { value: 98.4 }
];

const delayTimesData = [
  { value: 18 }, { value: 16 }, { value: 19 }, { value: 15 },
  { value: 14 }, { value: 12 }, { value: 15 }, { value: 14 }
];

export const AdminFleetPage: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);
  const [sortField, setSortField] = useState<keyof Driver>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Sorting Handler
  const handleSort = (field: keyof Driver) => {
    const isAsc = sortField === field ? !sortAsc : true;
    setSortField(field);
    setSortAsc(isAsc);
    
    const sorted = [...drivers].sort((a, b) => {
      if (a[field] < b[field]) return isAsc ? -1 : 1;
      if (a[field] > b[field]) return isAsc ? 1 : -1;
      return 0;
    });
    setDrivers(sorted);
  };

  // Dispatch Alert Action
  const triggerAlert = (driverName: string, vehicle: string) => {
    setAlertMessage(`🚨 Dispatch Alert broadcasted successfully to driver ${driverName} (${vehicle})!`);
    setTimeout(() => setAlertMessage(null), 4000);
  };

  return (
    <div className="space-y-6 bg-slate-100 p-6 rounded-2xl border border-slate-300 text-slate-900 font-sans shadow-lg">
      
      {/* Alert Header Notification */}
      {alertMessage && (
        <div className="fixed top-6 right-6 z-50 bg-black text-white px-6 py-4 rounded-xl shadow-2xl border-2 border-red-500 font-mono text-sm flex items-center gap-3 animate-bounce">
          <AlertTriangle className="text-red-500" size={20} />
          <span>{alertMessage}</span>
        </div>
      )}

      {/* Control Panel Title block */}
      <div className="flex items-center justify-between border-b-2 border-slate-300 pb-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-black">National Fleet Operations Desk</h1>
          <p className="text-slate-600 font-medium mt-1">Real-time route coordinates, telematics telemetry, and live dispatcher alerts.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-300 shadow-sm font-mono text-xs font-bold text-slate-700">
          <RefreshCw size={12} className="animate-spin text-slate-600" />
          <span>Auto-Refreshing 5s</span>
        </div>
      </div>

      {/* Top half split view */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Live Interactive Map Tracking active trucks (Left - col-span-7) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-300 p-5 shadow-sm flex flex-col justify-between min-h-[350px]">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
            <h2 className="text-base font-black uppercase text-black flex items-center gap-2">
              <MapPin size={18} className="text-red-600" />
              <span>Live Interactive Route Tracker</span>
            </h2>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 2))}
                className="p-1 hover:bg-slate-100 rounded border border-slate-300 text-slate-800"
                title="Zoom In"
              >
                <ZoomIn size={14} />
              </button>
              <button 
                onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.6))}
                className="p-1 hover:bg-slate-100 rounded border border-slate-300 text-slate-800"
                title="Zoom Out"
              >
                <ZoomOut size={14} />
              </button>
            </div>
          </div>

          {/* Interactive SVG Map Visualizing US Delivery Routes */}
          <div className="relative flex-1 bg-slate-50 rounded-lg border border-slate-200 overflow-hidden min-h-[220px]">
            <svg 
              viewBox="0 0 800 450" 
              className="w-full h-full transition-transform duration-300 ease-out origin-center"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              {/* Simple US Border Path Outline for stark visual feedback */}
              <path 
                d="M 100 100 Q 250 50 450 60 Q 600 40 700 120 Q 750 250 680 350 Q 550 400 350 380 Q 200 410 100 320 Z" 
                fill="none" 
                stroke="#cbd5e1" 
                strokeWidth={3} 
                strokeDasharray="4 4"
              />
              
              {/* Route Trajectories Lines */}
              {drivers.map((d, index) => (
                <line
                  key={d.id}
                  x1={200 + index * 80}
                  y1={150 + (index % 3) * 60}
                  x2={350 + index * 60}
                  y2={250 + (index % 2) * 50}
                  stroke={d.status === 'Delayed' ? '#d97706' : d.status === 'Stopped' ? '#dc2626' : '#2563eb'}
                  strokeWidth={2}
                  opacity={0.4}
                />
              ))}

              {/* Driver Cluster Pins */}
              {drivers.map((d, index) => {
                const x = 200 + index * 80;
                const y = 150 + (index % 3) * 60;
                return (
                  <g 
                    key={d.id} 
                    className="cursor-pointer group"
                    onClick={() => setSelectedDriver(d)}
                  >
                    {/* Ring Pulse */}
                    <circle 
                      cx={x} 
                      cy={y} 
                      r={14} 
                      className={`animate-ping origin-center ${
                        d.status === 'Delayed' ? 'fill-amber-500/20' : d.status === 'Stopped' ? 'fill-red-500/20' : 'fill-blue-500/20'
                      }`}
                    />
                    {/* Inner Core */}
                    <circle 
                      cx={x} 
                      cy={y} 
                      r={8} 
                      fill={d.status === 'Delayed' ? '#d97706' : d.status === 'Stopped' ? '#dc2626' : '#2563eb'}
                      className="stroke-white stroke-2 group-hover:scale-125 transition-transform"
                    />
                    <text 
                      x={x + 12} 
                      y={y + 4} 
                      fontSize={10} 
                      fontWeight="bold" 
                      fill="black"
                      className="opacity-0 group-hover:opacity-100 bg-white"
                    >
                      {d.vehicle}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Float Overlay Details on Hover/Click */}
            {selectedDriver && (
              <div className="absolute bottom-4 left-4 bg-white border-2 border-black p-3.5 rounded-lg shadow-xl font-mono text-xs max-w-[280px]">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
                  <span className="font-bold text-black">{selectedDriver.vehicle}</span>
                  <button onClick={() => setSelectedDriver(null)} className="text-slate-400 hover:text-black">✕</button>
                </div>
                <p><strong>Driver:</strong> {selectedDriver.name}</p>
                <p><strong>Route:</strong> {selectedDriver.route} ➔ {selectedDriver.destination}</p>
                <p><strong>Status:</strong> <span className={
                  selectedDriver.status === 'Delayed' ? 'text-amber-600' : selectedDriver.status === 'Stopped' ? 'text-red-600' : 'text-blue-600'
                }>{selectedDriver.status}</span></p>
                <p><strong>Health:</strong> {selectedDriver.health}</p>
              </div>
            )}
          </div>
        </div>

        {/* Telemetry Sparklines (Right - col-span-5) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-300 p-5 shadow-sm flex flex-col justify-between">
          <h2 className="text-base font-black uppercase text-black border-b border-slate-200 pb-3 mb-4 flex items-center gap-2">
            <Sparkles size={18} className="text-blue-600" />
            <span>Active Dispatch Metrics</span>
          </h2>
          
          {/* Sparkline 1: Delivery Success */}
          <div className="space-y-2 border-b border-slate-200 pb-4 mb-4">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Success Delivery Rate</span>
                <div className="text-3xl font-black text-black font-mono">98.4%</div>
              </div>
              <span className="text-xs font-mono font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded border border-green-300">+0.6% this hr</span>
            </div>
            <div className="h-14">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={successRateData}>
                  <defs>
                    <linearGradient id="successGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#successGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sparkline 2: Average Delay Times */}
          <div className="space-y-2">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Avg Delay Duration</span>
                <div className="text-3xl font-black text-black font-mono">14.0 min</div>
              </div>
              <span className="text-xs font-mono font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded border border-red-300">-2.3m this hr</span>
            </div>
            <div className="h-14">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={delayTimesData}>
                  <defs>
                    <linearGradient id="delayGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#delayGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom half: sortable data table */}
      <div className="bg-white rounded-xl border border-slate-300 p-5 shadow-sm">
        <h2 className="text-base font-black uppercase text-black border-b border-slate-200 pb-3 mb-4">
          Active Drivers & Telematics Log
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-sm">
            <thead>
              <tr className="border-b-2 border-slate-300 text-slate-700 font-bold bg-slate-50">
                <th onClick={() => handleSort('name')} className="p-3 cursor-pointer hover:bg-slate-200 transition-colors">
                  Driver Name {sortField === 'name' && (sortAsc ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('vehicle')} className="p-3 cursor-pointer hover:bg-slate-200 transition-colors">
                  Vehicle {sortField === 'vehicle' && (sortAsc ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('status')} className="p-3 cursor-pointer hover:bg-slate-200 transition-colors">
                  Route Status {sortField === 'status' && (sortAsc ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('health')} className="p-3 cursor-pointer hover:bg-slate-200 transition-colors">
                  Vehicle Health {sortField === 'health' && (sortAsc ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('route')} className="p-3 cursor-pointer hover:bg-slate-200 transition-colors">
                  Current Coords {sortField === 'route' && (sortAsc ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('lastUpdated')} className="p-3 cursor-pointer hover:bg-slate-200 transition-colors">
                  Last Ping {sortField === 'lastUpdated' && (sortAsc ? '▲' : '▼')}
                </th>
                <th className="p-3 text-center">Dispatch Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => (
                <tr key={d.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-bold text-black">{d.name}</td>
                  <td className="p-3">{d.vehicle}</td>
                  
                  {/* Status Tag */}
                  <td className="p-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold border ${
                      d.status === 'Active' ? 'bg-green-100 text-green-800 border-green-300' :
                      d.status === 'Delayed' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                      'bg-red-100 text-red-800 border-red-300'
                    }`}>
                      {d.status}
                    </span>
                  </td>

                  {/* Vehicle Health Warning */}
                  <td className="p-3">
                    <span className="flex items-center gap-1.5 font-bold">
                      {d.health === 'Normal' ? (
                        <>
                          <ShieldCheck className="text-green-600" size={16} />
                          <span className="text-green-700 text-xs">Normal</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className={d.health === 'Critical' ? 'text-red-600' : 'text-amber-600'} size={16} />
                          <span className={`text-xs ${d.health === 'Critical' ? 'text-red-700' : 'text-amber-700'}`}>
                            {d.health} Warning
                          </span>
                        </>
                      )}
                    </span>
                  </td>

                  <td className="p-3 font-sans text-xs text-slate-600">
                    {d.route} ➔ {d.destination}
                  </td>
                  
                  <td className="p-3 text-slate-500 text-xs">{d.lastUpdated}</td>
                  
                  {/* Quick-action Dispatch Alert Button */}
                  <td className="p-3 text-center">
                    <button
                      onClick={() => triggerAlert(d.name, d.vehicle)}
                      className="px-3 py-1.5 rounded-lg bg-black hover:bg-slate-800 text-white hover:text-red-200 font-sans font-bold text-xs flex items-center justify-center gap-1.5 mx-auto transition-all shadow-sm cursor-pointer"
                    >
                      <Send size={12} />
                      <span>Dispatch Alert</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AdminFleetPage;

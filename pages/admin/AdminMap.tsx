
import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../../services/api';
import { Branch, User, Role, Report, ReportPriority, ReportStatus } from '../../types';
import { GlassCard } from '../../components/ui/GlassCard';
import { AlertTriangle, MapPin, Radio, Users } from 'lucide-react';

// --- Types for Map Data ---
interface MapEntity {
  lat: number;
  lng: number;
}

interface MapBranch extends Omit<Branch, 'lat' | 'lng'>, MapEntity {
  hasCritical?: boolean;
}

interface MapTech extends User, MapEntity {
  heading?: number; // For movement direction
}

// --- Constants ---
const CENTER: [number, number] = [30.0444, 31.2357]; // Cairo

// --- Helper: Haversine Distance ---
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c;
};

// --- Custom Icons ---

const branchIcon = L.divIcon({
  className: 'branch-marker',
  html: `<div class="w-3 h-3 bg-indigo-500 rounded-full border-2 border-white shadow-[0_0_10px_#6366f1]"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

const criticalBranchIcon = L.divIcon({
  className: 'critical-marker',
  html: `
    <div class="relative w-full h-full flex items-center justify-center">
        <div class="absolute inset-0 bg-red-500 rounded-full opacity-50 animate-ping"></div>
        <div class="relative w-4 h-4 bg-red-600 rounded-full border-2 border-white shadow-[0_0_15px_red]"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const createTechIcon = (avatar: string) => L.divIcon({
  className: 'tech-marker',
  html: `
    <div class="relative transition-transform duration-500">
        <img src="${avatar}" class="w-8 h-8 rounded-full border-2 border-emerald-400 shadow-lg" style="object-fit: cover;" />
        <div class="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-slate-900"></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

// --- Main Component ---

export const AdminMap: React.FC = () => {
  const [branches, setBranches] = useState<MapBranch[]>([]);
  const [technicians, setTechnicians] = useState<MapTech[]>([]);
  
  // Interaction State
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const [u, r] = await Promise.all([api.getUsers(), api.getReports()]);
      
      // A. Simulate 102 Branches (Spread across Egypt)
      const simBranches: MapBranch[] = [];
      const centers = [
          { lat: 30.0444, lng: 31.2357, count: 60, spread: 0.3 }, // Cairo
          { lat: 31.2001, lng: 29.9187, count: 25, spread: 0.2 }, // Alex
          { lat: 30.5852, lng: 31.5021, count: 10, spread: 0.4 }, // Delta
          { lat: 27.1783, lng: 31.1859, count: 7, spread: 1.5 },  // Upper Egypt
      ];

      let idCounter = 1;
      centers.forEach(center => {
          for(let i=0; i<center.count; i++) {
              simBranches.push({
                  id: `br-real-${idCounter}`,
                  name: `فرع ${idCounter} - ${center.lat > 30 ? 'وجه بحري' : 'وجه قبلي'}`,
                  location: 'مصر',
                  lat: center.lat + (Math.random() - 0.5) * center.spread,
                  lng: center.lng + (Math.random() - 0.5) * center.spread,
                  hasCritical: false 
              });
              idCounter++;
          }
      });

      // Mark Critical Branches visually for demo
      const criticalBranchIds = new Set(
          r.filter(rep => rep.priority === ReportPriority.CRITICAL && rep.status !== ReportStatus.CLOSED)
           .map(rep => rep.branchId) 
      );
      
      if(criticalBranchIds.size === 0) {
          // Add fake criticals for demo if none exist
          for(let i=0; i<5; i++) {
              const idx = Math.floor(Math.random() * simBranches.length);
              simBranches[idx].hasCritical = true;
          }
      } else {
          simBranches.forEach(b => {
              if(criticalBranchIds.has(b.id)) b.hasCritical = true;
          });
      }

      setBranches(simBranches);

      // B. Setup Technicians
      const techs = u.filter(user => user.role === Role.TECHNICIAN).map(t => ({
          ...t,
          lat: 30.0444 + (Math.random() - 0.5) * 0.2,
          lng: 31.2357 + (Math.random() - 0.5) * 0.2,
          heading: Math.random() * 360
      }));
      setTechnicians(techs);
    };

    init();
  }, []);

  // Movement Simulation Loop
  useEffect(() => {
      const interval = setInterval(() => {
          setTechnicians(prevTechs => prevTechs.map(t => {
              const speed = 0.0005; 
              const dLat = Math.cos(t.heading! * (Math.PI / 180)) * speed;
              const dLng = Math.sin(t.heading! * (Math.PI / 180)) * speed;
              const newHeading = (t.heading! + (Math.random() - 0.5) * 30) % 360;

              return {
                  ...t,
                  lat: t.lat + dLat,
                  lng: t.lng + dLng,
                  heading: newHeading
              };
          }));
      }, 1000); 

      return () => clearInterval(interval);
  }, []);


  const routeData = useMemo(() => {
      if (!selectedBranchId) return null;
      
      const branch = branches.find(b => b.id === selectedBranchId);
      if (!branch) return null;

      let nearestTech: MapTech | null = null;
      let minDist = Infinity;

      technicians.forEach(t => {
          const d = getDistance(branch.lat, branch.lng, t.lat, t.lng);
          if (d < minDist) {
              minDist = d;
              nearestTech = t;
          }
      });

      if (!nearestTech) return null;

      return {
          branch,
          tech: nearestTech,
          distance: minDist.toFixed(1)
      };

  }, [selectedBranchId, branches, technicians]);


  return (
    <GlassCard className="h-[calc(100vh-140px)] w-full overflow-hidden relative border-0 rounded-none md:rounded-2xl shadow-2xl">
      
      <style>{`
        @keyframes ping {
            75%, 100% { transform: scale(2); opacity: 0; }
        }
        .animate-ping {
            animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>

      {/* HUD */}
      <div className="absolute top-4 right-4 z-[500] pointer-events-none flex flex-col gap-2">
          <GlassCard className="p-4 bg-slate-900/90 backdrop-blur-xl border-slate-700 pointer-events-auto min-w-[240px]">
              <h3 className="font-bold text-white flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
                  <Radio className="text-red-500 animate-pulse" size={18} />
                  غرفة التتبع الحية
              </h3>
              <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-2"><MapPin size={12} /> الفروع النشطة</span>
                      <span className="text-indigo-400 font-mono font-bold text-lg">{branches.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-2"><Users size={12} /> الفنيين بالميدان</span>
                      <span className="text-emerald-400 font-mono font-bold text-lg">{technicians.length}</span>
                  </div>
                  <div className="flex justify-between items-center bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                      <span className="text-red-200 flex items-center gap-2"><AlertTriangle size={12} /> بلاغات حرجة</span>
                      <span className="text-red-400 font-mono font-bold text-lg">{branches.filter(b => b.hasCritical).length}</span>
                  </div>
              </div>
          </GlassCard>
      </div>

      <MapContainer 
        center={CENTER} 
        zoom={8} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%', background: '#0f172a' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {branches.map(branch => (
            <Marker 
                key={branch.id} 
                position={[branch.lat, branch.lng]} 
                icon={branch.hasCritical ? criticalBranchIcon : branchIcon}
                eventHandlers={{
                    click: () => setSelectedBranchId(branch.id)
                }}
            >
                <Popup className="glass-popup">
                    <div className="text-right p-2 min-w-[180px]">
                        <h4 className={`font-bold text-base ${branch.hasCritical ? 'text-red-400' : 'text-indigo-400'}`}>
                            {branch.name}
                        </h4>
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                            <MapPin size={10} /> {branch.lat.toFixed(4)}, {branch.lng.toFixed(4)}
                        </div>
                        {branch.hasCritical && (
                            <div className="mt-3 bg-red-500/10 text-red-400 text-xs px-2 py-2 rounded-lg border border-red-500/20 flex items-center gap-2 font-bold animate-pulse">
                                <AlertTriangle size={14} /> يوجد بلاغ حرج
                            </div>
                        )}
                        <button 
                            className="mt-3 w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-2 rounded-lg transition-colors font-bold shadow-lg shadow-indigo-500/20"
                            onClick={() => setSelectedBranchId(branch.id)}
                        >
                            تحديد وطلب فني
                        </button>
                    </div>
                </Popup>
            </Marker>
        ))}

        {technicians.map(tech => (
            <Marker 
                key={tech.id} 
                position={[tech.lat, tech.lng]} 
                icon={createTechIcon(tech.avatar || 'https://picsum.photos/50')}
            >
                <Popup>
                    <div className="text-right p-1">
                        <div className="flex items-center gap-3 mb-1">
                            <img src={tech.avatar || 'https://picsum.photos/50'} className="w-10 h-10 rounded-full border border-emerald-500" />
                            <div>
                                <h4 className="font-bold text-emerald-400 text-sm">{tech.name}</h4>
                                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">متصل الآن</span>
                            </div>
                        </div>
                    </div>
                </Popup>
            </Marker>
        ))}

        {routeData && (
            <>
                <Polyline 
                    positions={[
                        [routeData.branch.lat, routeData.branch.lng],
                        [routeData.tech.lat, routeData.tech.lng]
                    ]}
                    pathOptions={{ color: '#10b981', weight: 2, dashArray: '5, 10', opacity: 0.6 }}
                />
                <Marker 
                    position={[
                        (routeData.branch.lat + routeData.tech.lat) / 2,
                        (routeData.branch.lng + routeData.tech.lng) / 2
                    ]}
                    icon={L.divIcon({
                        className: 'label-icon',
                        html: `<div style="background:rgba(15,23,42,0.9); border:1px solid #10b981; color:#10b981; padding:4px 8px; border-radius:8px; font-size:11px; white-space:nowrap; font-weight:bold; box-shadow:0 4px 6px rgba(0,0,0,0.3); backdrop-filter:blur(4px);">${routeData.distance} كم</div>`
                    })}
                />
            </>
        )}
      </MapContainer>
    </GlassCard>
  );
};

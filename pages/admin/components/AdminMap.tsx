
import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../../../services/api';
import { Branch, User, Role, Report, ReportPriority, ReportStatus } from '../../../types';
import { GlassCard } from '../../../components/ui/GlassCard';
import { AlertTriangle, MapPin, Radio, Users, Clock, Ruler, Navigation } from 'lucide-react';

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
  html: `<div class="w-4 h-4 bg-indigo-500 rounded-full border-2 border-white shadow-[0_0_15px_#6366f1] relative z-10"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const criticalBranchIcon = L.divIcon({
  className: 'critical-marker',
  html: `
    <div class="relative w-full h-full flex items-center justify-center">
        <div class="absolute inset-0 bg-red-500 rounded-full opacity-50 animate-ping"></div>
        <div class="relative w-5 h-5 bg-red-600 rounded-full border-2 border-white shadow-[0_0_20px_red] z-20"></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

const createTechIcon = (avatar: string) => L.divIcon({
  className: 'tech-marker',
  html: `
    <div class="relative group">
        <img src="${avatar}" class="w-10 h-10 rounded-full border-2 border-emerald-400 shadow-xl bg-slate-800 object-cover relative z-20 transition-transform hover:scale-110" />
        <div class="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-slate-900 z-30 animate-pulse"></div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

// --- Main Component ---

export const AdminMap: React.FC = () => {
  const [branches, setBranches] = useState<MapBranch[]>([]);
  const [technicians, setTechnicians] = useState<MapTech[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  
  // Interaction State
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      // Fetch Real Data
      const [u, r, b] = await Promise.all([api.getUsers(), api.getReports(), api.getBranches()]);
      setReports(r);

      // Map Real Branches
      const realBranches = b.map(branch => {
          const hasCritical = r.some(rep => rep.branchId === branch.id && rep.priority === ReportPriority.CRITICAL && rep.status !== ReportStatus.CLOSED);
          return {
              ...branch,
              lat: branch.lat || 30.0444,
              lng: branch.lng || 31.2357,
              hasCritical
          };
      });
      setBranches(realBranches);

      // Setup Technicians (Simulated locations for demo purposes)
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
      }, 2000); 

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

      // Estimate ETA (40km/h average speed)
      const eta = Math.ceil((minDist / 40) * 60);

      return {
          branch,
          tech: nearestTech,
          distance: minDist.toFixed(1),
          eta
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
        .leaflet-popup-close-button {
            color: #94a3b8 !important;
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
        zoom={7} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%', background: '#0f172a' }}
      >
        {/* CartoDB Dark Matter Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {branches.map(branch => {
            const isSelected = selectedBranchId === branch.id;
            
            return (
                <Marker 
                    key={branch.id} 
                    position={[branch.lat, branch.lng]} 
                    icon={branch.hasCritical ? criticalBranchIcon : branchIcon}
                    eventHandlers={{
                        click: () => setSelectedBranchId(branch.id)
                    }}
                >
                    <Popup className="glass-popup" minWidth={280}>
                        <div className="text-right p-2 w-full">
                            {/* Branch Name Header */}
                            <div className="border-b border-white/10 pb-2 mb-2">
                                <h4 className={`font-bold text-lg ${branch.hasCritical ? 'text-red-400' : 'text-indigo-400'}`}>
                                    {branch.name}
                                </h4>
                                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono mt-1">
                                    <MapPin size={10} /> {branch.location}
                                </div>
                            </div>
                            
                            {branch.hasCritical && (
                                <div className="mb-2 bg-red-500/10 text-red-400 text-xs px-2 py-2 rounded-lg border border-red-500/20 flex items-center gap-2 font-bold animate-pulse">
                                    <AlertTriangle size={14} /> يوجد بلاغ حرج
                                </div>
                            )}

                            {isSelected && routeData ? (
                                <div className="animate-in fade-in zoom-in duration-300 bg-slate-800/50 rounded-xl p-3 border border-white/5 mt-2">
                                    {/* Nearest Tech Section */}
                                    <div className="flex items-center gap-3 mb-3 border-b border-white/5 pb-2">
                                        <img src={routeData.tech.avatar || 'https://picsum.photos/50'} className="w-10 h-10 rounded-full border border-emerald-500 shadow-md" />
                                        <div>
                                            <span className="text-[10px] text-emerald-400 block mb-0.5 font-bold">أقرب فني متاح</span>
                                            <h5 className="font-bold text-white text-sm">{routeData.tech.name}</h5>
                                        </div>
                                    </div>
                                    
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                        <div className="bg-slate-900 p-2 rounded-lg text-center border border-white/5">
                                            <span className="text-[10px] text-slate-500 block mb-1">المسافة</span>
                                            <div className="flex items-center justify-center gap-1 text-emerald-400">
                                                <Ruler size={14} />
                                                <span className="text-sm font-mono font-bold">{routeData.distance} كم</span>
                                            </div>
                                        </div>
                                        <div className="bg-slate-900 p-2 rounded-lg text-center border border-white/5">
                                            <span className="text-[10px] text-slate-500 block mb-1">زمن الوصول</span>
                                            <div className="flex items-center justify-center gap-1 text-emerald-400">
                                                <Clock size={14} />
                                                <span className="text-sm font-mono font-bold">{routeData.eta} دقيقة</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs py-2.5 rounded-lg font-bold shadow-lg flex items-center justify-center gap-2 transition-all">
                                        <Navigation size={14} /> إسناد المهمة للفني
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <div className="animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                                    <span className="text-[10px] text-slate-500">جاري حساب المسافات...</span>
                                </div>
                            )}
                        </div>
                    </Popup>
                </Marker>
            );
        })}

        {technicians.map(tech => (
            <Marker 
                key={tech.id} 
                position={[tech.lat, tech.lng]} 
                icon={createTechIcon(tech.avatar || 'https://picsum.photos/50')}
            >
                <Popup className="glass-popup">
                    <div className="text-right p-1 min-w-[180px]">
                        <div className="flex items-center gap-3 mb-2 pb-2 border-b border-white/10">
                            <img src={tech.avatar || 'https://picsum.photos/50'} className="w-10 h-10 rounded-full border border-emerald-500" />
                            <div>
                                <h4 className="font-bold text-emerald-400 text-sm">{tech.name}</h4>
                                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">متصل الآن</span>
                            </div>
                        </div>
                        <div className="text-xs text-slate-400">
                            متاح لاستقبال مهام جديدة
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
                    pathOptions={{ color: '#10b981', weight: 3, dashArray: '10, 10', opacity: 0.8 }}
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

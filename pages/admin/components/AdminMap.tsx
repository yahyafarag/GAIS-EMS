
import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../../../services/api';
import { Branch, User, Role, Report, ReportPriority, ReportStatus } from '../../../types';
import { GlassCard } from '../../../components/ui/GlassCard';
import { AlertTriangle, MapPin, Radio, Users, Clock, Ruler, Navigation, ExternalLink, Phone, User as UserIcon, Building2 } from 'lucide-react';

// --- Types for Map Data ---
interface MapEntity {
  lat: number;
  lng: number;
}

interface MapBranch extends Omit<Branch, 'lat' | 'lng'>, MapEntity {
  hasCritical?: boolean;
  managerName?: string;
  activeReportsCount?: number;
}

interface MapTech extends User, MapEntity {
  heading?: number; // For movement direction
}

// --- Constants ---
const CENTER: [number, number] = [28.0, 30.8]; // Zoomed out view of Egypt

// --- Helpers ---

// Haversine Distance
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

// Brand Color Mapping
const getBrandColor = (brand?: string) => {
    if (!brand) return 'indigo';
    if (brand.includes('بلبن')) return 'blue';
    if (brand.includes('وهمى') || brand.includes('برجر')) return 'orange';
    if (brand.includes('شلتت')) return 'emerald';
    return 'indigo';
};

// --- Custom Icons ---

const createBranchIcon = (brand: string, isCritical: boolean) => {
    const colorClass = isCritical ? 'bg-red-500 shadow-red-500/50' : 
                      brand.includes('بلبن') ? 'bg-blue-500 shadow-blue-500/50' :
                      brand.includes('وهمى') ? 'bg-orange-500 shadow-orange-500/50' : 
                      'bg-indigo-500 shadow-indigo-500/50';
    
    return L.divIcon({
        className: 'custom-branch-marker',
        html: `
            <div class="relative group">
                ${isCritical ? '<div class="absolute inset-0 rounded-full animate-ping bg-red-500 opacity-75"></div>' : ''}
                <div class="w-4 h-4 rounded-full border-2 border-white shadow-[0_0_15px] ${colorClass} relative z-10 transition-transform duration-300 group-hover:scale-125"></div>
            </div>
        `,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
    });
};

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
  
  // Interaction State
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      // Fetch Real Data
      const [users, reports, apiBranches] = await Promise.all([
          api.getUsers(), 
          api.getReports(), 
          api.getBranches()
      ]);

      // 1. Process Branches (Use Real Coordinates)
      const processedBranches: MapBranch[] = apiBranches.map(branch => {
          // Find active reports for this branch
          const branchReports = reports.filter(r => r.branchId === branch.id && r.status !== ReportStatus.CLOSED && r.status !== ReportStatus.COMPLETED);
          const hasCritical = branchReports.some(r => r.priority === ReportPriority.CRITICAL);
          
          // Find manager name
          const manager = users.find(u => u.id === branch.managerId);

          return {
              ...branch,
              lat: branch.lat || 30.0444, // Fallback if missing
              lng: branch.lng || 31.2357,
              hasCritical,
              activeReportsCount: branchReports.length,
              managerName: manager?.name
          };
      });

      setBranches(processedBranches);

      // 2. Setup Technicians (Simulate location around active branches for demo)
      // In production, this would come from real GPS tracking API
      const techs = users.filter(user => user.role === Role.TECHNICIAN).map((t, idx) => {
          // Distribute techs somewhat randomly near Cairo/Alex for demo
          const baseLat = idx % 2 === 0 ? 30.0444 : 31.2001;
          const baseLng = idx % 2 === 0 ? 31.2357 : 29.9187;
          
          return {
              ...t,
              lat: baseLat + (Math.random() - 0.5) * 0.1,
              lng: baseLng + (Math.random() - 0.5) * 0.1,
              heading: Math.random() * 360
          };
      });
      setTechnicians(techs);
    };

    init();
  }, []);

  // Movement Simulation Loop (Visual Candy)
  useEffect(() => {
      const interval = setInterval(() => {
          setTechnicians(prevTechs => prevTechs.map(t => {
              const speed = 0.0003; 
              const dLat = Math.cos(t.heading! * (Math.PI / 180)) * speed;
              const dLng = Math.sin(t.heading! * (Math.PI / 180)) * speed;
              const newHeading = (t.heading! + (Math.random() - 0.5) * 30) % 360; // Random turn

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

      // Estimate ETA (40km/h average speed in city)
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
        .leaflet-popup-content-wrapper {
            background: rgba(15, 23, 42, 0.95) !important;
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255,255,255,0.1);
        }
        .leaflet-popup-tip {
            background: rgba(15, 23, 42, 0.95) !important;
        }
      `}</style>

      {/* HUD Overlay */}
      <div className="absolute top-4 right-4 z-[500] pointer-events-none flex flex-col gap-2">
          <GlassCard className="p-4 bg-slate-900/90 backdrop-blur-xl border-slate-700 pointer-events-auto min-w-[240px]">
              <h3 className="font-bold text-white flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
                  <Radio className="text-red-500 animate-pulse" size={18} />
                  غرفة التتبع الحية
              </h3>
              <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-2"><MapPin size={12} /> الفروع المسجلة</span>
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
        zoom={6} 
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
            const googleMapsUrl = branch.mapLink || `https://www.google.com/maps/search/?api=1&query=${branch.lat},${branch.lng}`;
            const brandColor = getBrandColor(branch.brand);

            return (
                <Marker 
                    key={branch.id} 
                    position={[branch.lat, branch.lng]} 
                    icon={createBranchIcon(branch.brand || '', !!branch.hasCritical)}
                    eventHandlers={{
                        click: () => setSelectedBranchId(branch.id)
                    }}
                >
                    <Popup className="glass-popup" minWidth={300} maxWidth={320}>
                        <div className="text-right p-1 w-full" dir="rtl">
                            {/* Header: Brand & Status */}
                            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                                {branch.brand && (
                                    <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase
                                        ${brandColor === 'blue' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 
                                          brandColor === 'orange' ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' : 
                                          'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'}`}>
                                        {branch.brand}
                                    </span>
                                )}
                                {branch.hasCritical ? (
                                    <span className="flex items-center gap-1 text-[10px] bg-red-500 text-white px-2 py-0.5 rounded font-bold animate-pulse">
                                        <AlertTriangle size={10} /> طوارئ
                                    </span>
                                ) : (
                                    <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> مستقر
                                    </span>
                                )}
                            </div>

                            {/* Branch Info */}
                            <h4 className="font-bold text-lg text-white mb-2 leading-tight flex items-start gap-2">
                                <Building2 size={18} className="text-slate-500 mt-1 shrink-0" />
                                {branch.name}
                            </h4>
                            
                            <div className="space-y-2 mb-4 bg-slate-900/50 p-3 rounded-lg border border-white/5">
                                <div className="flex items-start gap-2 text-xs text-slate-300">
                                    <MapPin size={14} className="text-slate-500 shrink-0 mt-0.5" />
                                    <span className="leading-relaxed">{branch.location}</span>
                                </div>
                                {branch.managerName && (
                                    <div className="flex items-center gap-2 text-xs text-slate-300">
                                        <UserIcon size={14} className="text-slate-500 shrink-0" />
                                        <span>المدير: {branch.managerName}</span>
                                    </div>
                                )}
                                {branch.phone && (
                                    <div className="flex items-center gap-2 text-xs text-slate-300">
                                        <Phone size={14} className="text-slate-500 shrink-0" />
                                        <span dir="ltr" className="text-right">{branch.phone}</span>
                                    </div>
                                )}
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-2 mb-3">
                                <div className="bg-slate-800 p-2 rounded text-center">
                                    <span className="block text-[10px] text-slate-500">بلاغات نشطة</span>
                                    <span className="text-sm font-bold text-white">{branch.activeReportsCount || 0}</span>
                                </div>
                                <div className="bg-slate-800 p-2 rounded text-center">
                                    <span className="block text-[10px] text-slate-500">الفنيين بالجوار</span>
                                    {/* Calculated dynamically just for visual */}
                                    <span className="text-sm font-bold text-indigo-400">
                                        {technicians.filter(t => getDistance(branch.lat, branch.lng, t.lat, t.lng) < 50).length}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <a 
                                    href={googleMapsUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs py-2 rounded-lg transition-colors font-bold flex items-center justify-center gap-2 border border-white/10"
                                >
                                    <ExternalLink size={12} /> الخريطة
                                </a>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedBranchId(branch.id);
                                    }}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-2 rounded-lg transition-colors font-bold shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                                >
                                    <Navigation size={12} /> طلب فني
                                </button>
                            </div>

                            {/* Route Info Section (If Selected) */}
                            {isSelected && routeData && (
                                <div className="mt-3 pt-3 border-t border-white/10 animate-in fade-in zoom-in duration-300">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <span className="text-[10px] text-emerald-400 font-bold uppercase">تم تحديد أقرب فني</span>
                                    </div>
                                    <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg">
                                        <img src={routeData.tech.avatar || 'https://picsum.photos/50'} className="w-8 h-8 rounded-full border border-emerald-500" />
                                        <div className="flex-1">
                                            <h5 className="font-bold text-white text-xs">{routeData.tech.name}</h5>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[10px] text-emerald-300 flex items-center gap-1"><Ruler size={10} /> {routeData.distance} كم</span>
                                                <span className="text-[10px] text-emerald-300 flex items-center gap-1"><Clock size={10} /> {routeData.eta} دقيقة</span>
                                            </div>
                                        </div>
                                    </div>
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


import React, { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../../../services/api';
import { Branch, User, Role, Report, ReportPriority, ReportStatus } from '../../../types';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Navigation, AlertTriangle, User as UserIcon, MapPin, Radio, Wrench } from 'lucide-react';

// --- Types for Map Data ---
interface MapEntity {
  lat: number;
  lng: number;
}

interface MapBranch extends Branch, MapEntity {
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

// 1. Branch Icon (Standard)
const branchIcon = L.divIcon({
  className: 'branch-marker',
  html: `<div class="w-3 h-3 bg-indigo-500 rounded-full border-2 border-white shadow-[0_0_10px_#6366f1]"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

// 2. Critical Branch Icon (Rippling Red)
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

// 3. Technician Icon (With Avatar mockup)
const createTechIcon = (avatar: string) => L.divIcon({
  className: 'tech-marker',
  html: `
    <div class="relative">
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
  const [reports, setReports] = useState<Report[]>([]);
  
  // Interaction State
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  // --- 1. Data Initialization & Branch Simulation ---
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const [u, r] = await Promise.all([api.getUsers(), api.getReports()]);
      
      if (!isMounted) return;

      setReports(r);

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

      // Mark Critical Branches based on Reports
      const criticalBranchIds = new Set(
          r.filter(rep => rep.priority === ReportPriority.CRITICAL && rep.status !== ReportStatus.CLOSED)
           .map(rep => rep.branchId)
      );
      
      if(criticalBranchIds.size === 0) {
          for(let i=0; i<5; i++) {
              const idx = Math.floor(Math.random() * simBranches.length);
              if (simBranches[idx]) simBranches[idx].hasCritical = true;
          }
      } else {
          simBranches.forEach(b => {
              if(criticalBranchIds.has(b.id)) b.hasCritical = true;
          });
      }

      setBranches(simBranches);

      // B. Setup Technicians (Initial Locations around Cairo)
      const techs = u.filter(user => user.role === Role.TECHNICIAN).map(t => ({
          ...t,
          lat: 30.0444 + (Math.random() - 0.5) * 0.2,
          lng: 31.2357 + (Math.random() - 0.5) * 0.2,
          heading: Math.random() * 360
      }));
      setTechnicians(techs);
    };

    init();
    return () => { isMounted = false; };
  }, []);

  // --- 2. Live Tracking Simulation (Movement Loop) ---
  useEffect(() => {
      const interval = setInterval(() => {
          setTechnicians(prevTechs => prevTechs.map(t => {
              // Move slightly in random direction
              const speed = 0.001; // roughly 100m jump
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
      }, 2000); // Update every 2 seconds

      return () => clearInterval(interval);
  }, []);


  // --- 3. Nearest Tech Calculation ---
  const routeData = useMemo(() => {
      if (!selectedBranchId) return null;
      
      const branch = branches.find(b => b.id === selectedBranchId);
      if (!branch) return null;

      // Find nearest tech
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
    <GlassCard className="h-[calc(100vh-140px)] w-full overflow-hidden relative border-0 rounded-none md:rounded-2xl">
      
      {/* Styles for Ripples */}
      <style>{`
        @keyframes ping {
            75%, 100% { transform: scale(2); opacity: 0; }
        }
        .animate-ping {
            animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>

      {/* Floating HUD */}
      <div className="absolute top-4 right-4 z-[500] flex flex-col gap-2 pointer-events-none">
          <GlassCard className="p-4 bg-slate-900/90 backdrop-blur-xl border-slate-700 pointer-events-auto">
              <h3 className="font-bold text-white flex items-center gap-2 mb-3">
                  <Radio className="text-red-500 animate-pulse" size={18} />
                  غرفة التتبع الحية
              </h3>
              <div className="space-y-2 text-xs">
                  <div className="flex justify-between w-48">
                      <span className="text-slate-400">الفروع المتصلة</span>
                      <span className="text-indigo-400 font-mono font-bold">{branches.length}</span>
                  </div>
                  <div className="flex justify-between w-48">
                      <span className="text-slate-400">فني ميداني</span>
                      <span className="text-emerald-400 font-mono font-bold">{technicians.length}</span>
                  </div>
                  <div className="flex justify-between w-48">
                      <span className="text-slate-400">بلاغات حرجة</span>
                      <span className="text-red-400 font-mono font-bold">{branches.filter(b => b.hasCritical).length}</span>
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
        {/* CartoDB Dark Matter Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* --- Render Branches --- */}
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
                    <div className="text-right p-1 min-w-[150px]">
                        <h4 className={`font-bold text-sm ${branch.hasCritical ? 'text-red-400' : 'text-indigo-400'}`}>
                            {branch.name}
                        </h4>
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                            <MapPin size={10} /> {branch.lat.toFixed(4)}, {branch.lng.toFixed(4)}
                        </div>
                        {branch.hasCritical && (
                            <div className="mt-2 bg-red-500/10 text-red-400 text-xs px-2 py-1 rounded border border-red-500/20 flex items-center gap-1">
                                <AlertTriangle size={12} /> بلاغ حرج نشط
                            </div>
                        )}
                        <button 
                            className="mt-2 w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-1 rounded transition-colors"
                            onClick={() => setSelectedBranchId(branch.id)}
                        >
                            بحث عن أقرب فني
                        </button>
                    </div>
                </Popup>
            </Marker>
        ))}

        {/* --- Render Technicians --- */}
        {technicians.map(tech => {
            // Logic for popup data: Current Task
            const activeReport = reports.find(r => r.assignedTechnicianId === tech.id && (r.status === ReportStatus.ASSIGNED || r.status === ReportStatus.IN_PROGRESS));
            
            // Logic for popup data: Nearest Critical
            let nearestCritical = null;
            let minDist = Infinity;

            reports.forEach(r => {
                if (r.priority === ReportPriority.CRITICAL && r.status !== ReportStatus.CLOSED && r.status !== ReportStatus.COMPLETED) {
                    const branch = branches.find(b => b.id === r.branchId);
                    if (branch) {
                        const d = getDistance(tech.lat, tech.lng, branch.lat, branch.lng);
                        if (d < minDist) {
                            minDist = d;
                            nearestCritical = { id: r.id, dist: d };
                        }
                    }
                }
            });

            // Calculate ETA (assuming 40 km/h average city speed)
            const etaMinutes = nearestCritical ? Math.ceil((nearestCritical.dist / 40) * 60) : null;

            return (
                <Marker 
                    key={tech.id} 
                    position={[tech.lat, tech.lng]} 
                    icon={createTechIcon(tech.avatar || 'https://picsum.photos/50')}
                >
                    <Popup className="glass-popup">
                        <div className="text-right p-2 min-w-[220px]">
                            
                            {/* Header */}
                            <div className="flex items-center gap-3 mb-3 border-b border-white/10 pb-2">
                                <img src={tech.avatar || 'https://picsum.photos/50'} className="w-10 h-10 rounded-full border border-emerald-500" />
                                <div>
                                    <h4 className="font-bold text-emerald-400 text-sm">{tech.name}</h4>
                                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">متصل الآن</span>
                                </div>
                            </div>

                            {/* Current Task Section */}
                            <div className="mb-3">
                                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold uppercase mb-1">
                                    <Wrench size={10} /> المهمة الحالية
                                </div>
                                {activeReport ? (
                                    <div className="bg-slate-800/50 rounded-lg p-2 border border-white/5">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-indigo-300 font-mono text-xs">#{activeReport.id.split('-')[1]}</span>
                                            <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1 rounded">{activeReport.status}</span>
                                        </div>
                                        <p className="text-xs text-slate-300 leading-snug line-clamp-2">{activeReport.description}</p>
                                    </div>
                                ) : (
                                    <div className="text-xs text-slate-500 italic bg-slate-800/30 p-2 rounded">
                                        لا توجد مهام نشطة حالياً
                                    </div>
                                )}
                            </div>

                            {/* Nearest Critical Section */}
                            {nearestCritical && (
                                <div className="animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex items-center gap-1 text-[10px] text-red-400 font-bold uppercase mb-1">
                                        <AlertTriangle size={10} /> أقرب حالة حرجة
                                    </div>
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-red-200 font-mono text-xs">#{nearestCritical.id.split('-')[1]}</span>
                                            <span className="text-red-400 text-xs font-bold">{nearestCritical.dist.toFixed(1)} كم</span>
                                        </div>
                                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-red-500/10">
                                            <span className="text-[10px] text-red-300">الوصول المتوقع (ETA)</span>
                                            <span className="text-sm font-bold text-white font-mono">{etaMinutes} دقيقة</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </Popup>
                </Marker>
            );
        })}

        {/* --- Dynamic Routing Polyline --- */}
        {routeData && (
            <>
                {/* The Line */}
                <Polyline 
                    positions={[
                        [routeData.branch.lat, routeData.branch.lng],
                        [routeData.tech.lat, routeData.tech.lng]
                    ]}
                    pathOptions={{ color: '#10b981', weight: 3, dashArray: '10, 10', opacity: 0.6 }}
                />
                
                {/* Distance Label in Middle */}
                <Marker 
                    position={[
                        (routeData.branch.lat + routeData.tech.lat) / 2,
                        (routeData.branch.lng + routeData.tech.lng) / 2
                    ]}
                    icon={L.divIcon({
                        className: 'label-icon',
                        html: `<div style="background:#0f172a; border:1px solid #10b981; color:#10b981; padding:2px 6px; border-radius:4px; font-size:10px; white-space:nowrap;">${routeData.distance} كم</div>`
                    })}
                />
            </>
        )}

      </MapContainer>
    </GlassCard>
  );
};

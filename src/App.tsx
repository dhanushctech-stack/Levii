/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wifi, 
  WifiOff, 
  Lock, 
  Unlock, 
  MapPin, 
  RefreshCw, 
  SignalHigh, 
  SignalMedium, 
  SignalLow, 
  Coffee, 
  Library, 
  Globe,
  Info,
  ChevronRight,
  Zap,
  ShieldCheck,
  ArrowUpDown,
  Eye,
  EyeOff,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { findNearbyWiFi, retrievePasswordEthically, type WiFiHotspot } from './services/geminiService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type SortKey = 'signalStrength' | 'distanceValue' | 'name';

export default function App() {
  const [isScanning, setIsScanning] = useState(false);
  const [hotspots, setHotspots] = useState<WiFiHotspot[]>([]);
  const [selectedHotspot, setSelectedHotspot] = useState<WiFiHotspot | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('signalStrength');
  const [isRetrieving, setIsRetrieving] = useState(false);
  const [retrievalResult, setRetrievalResult] = useState<{ password?: string; message: string } | null>(null);
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);

  const startScan = useCallback(async () => {
    setIsScanning(true);
    setError(null);
    setHotspots([]);
    setSelectedHotspot(null);
    setRetrievalResult(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setIsScanning(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        
        try {
          const results = await findNearbyWiFi(latitude, longitude);
          setHotspots(results);
        } catch (err) {
          setError("Failed to fetch nearby hotspots. Please try again.");
        } finally {
          setIsScanning(false);
        }
      },
      (err) => {
        setError("Location access denied. Please enable location to find nearby Wi-Fi.");
        setIsScanning(false);
      }
    );
  }, []);

  useEffect(() => {
    startScan();
  }, [startScan]);

  const sortedHotspots = useMemo(() => {
    return [...hotspots].sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name);
      if (sortKey === 'distanceValue') return (a.distanceValue || 0) - (b.distanceValue || 0);
      return (b.signalStrength || 0) - (a.signalStrength || 0);
    });
  }, [hotspots, sortKey]);

  const handleRetrievePassword = async (spot: WiFiHotspot) => {
    setIsRetrieving(true);
    setRetrievalResult(null);
    try {
      const result = await retrievePasswordEthically(spot);
      setRetrievalResult(result);
    } catch (err) {
      setRetrievalResult({ message: "Failed to retrieve password. Please try again." });
    } finally {
      setIsRetrieving(false);
    }
  };

  const getSignalIcon = (strength: number) => {
    if (strength > 80) return <SignalHigh className="w-4 h-4 text-emerald-400" />;
    if (strength > 50) return <SignalMedium className="w-4 h-4 text-amber-400" />;
    return <SignalLow className="w-4 h-4 text-rose-400" />;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Cafe': return <Coffee className="w-4 h-4" />;
      case 'Library': return <Library className="w-4 h-4" />;
      default: return <Globe className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-zinc-100 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-md mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <h1 className="font-bold tracking-tight text-lg">NetScout</h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowPrivacyNotice(true)}
              className="p-2 hover:bg-white/5 rounded-full transition-colors"
              title="Privacy & Ethics"
            >
              <ShieldCheck className="w-5 h-5 text-zinc-400" />
            </button>
            <button 
              onClick={startScan}
              disabled={isScanning}
              className="p-2 hover:bg-white/5 rounded-full transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn("w-5 h-5 text-zinc-400", isScanning && "animate-spin")} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 py-8 space-y-8 pb-24">
        {/* Radar Section */}
        <section className="relative flex flex-col items-center justify-center py-12">
          <div className="relative w-64 h-64">
            <div className="absolute inset-0 border border-white/5 rounded-full" />
            <div className="absolute inset-0 m-8 border border-white/5 rounded-full" />
            <div className="absolute inset-0 m-16 border border-white/5 rounded-full" />
            <div className="absolute inset-0 m-24 border border-white/5 rounded-full" />
            
            {isScanning && (
              <motion.div 
                className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-500/20 to-transparent origin-center"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 100%)' }}
              />
            )}

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-500",
                  isScanning ? "bg-emerald-500/20 border-emerald-500/40 scale-110" : "bg-zinc-900 border-zinc-800"
                )}>
                  <Wifi className={cn("w-6 h-6", isScanning ? "text-emerald-400" : "text-zinc-500")} />
                </div>
                {isScanning && (
                  <motion.div 
                    className="absolute -inset-2 border border-emerald-500/30 rounded-full"
                    animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  />
                )}
              </div>
            </div>

            {!isScanning && sortedHotspots.map((spot, idx) => (
              <motion.div
                key={spot.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="absolute w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                style={{
                  top: `${15 + Math.random() * 70}%`,
                  left: `${15 + Math.random() * 70}%`,
                }}
              />
            ))}
          </div>

          <div className="mt-8 text-center">
            <h2 className="text-zinc-400 text-sm font-medium uppercase tracking-widest">
              {isScanning ? "Scanning Frequencies..." : `${hotspots.length} Networks Detected`}
            </h2>
            {location && (
              <div className="flex items-center justify-center gap-1 mt-1 text-zinc-600 text-xs">
                <MapPin className="w-3 h-3" />
                <span>{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
              </div>
            )}
          </div>
        </section>

        {/* Sorting Controls */}
        {!isScanning && hotspots.length > 0 && (
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Available Networks</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setSortKey('signalStrength')}
                className={cn("text-[10px] px-2 py-1 rounded-md border transition-all", sortKey === 'signalStrength' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "border-white/5 text-zinc-500")}
              >
                Signal
              </button>
              <button 
                onClick={() => setSortKey('distanceValue')}
                className={cn("text-[10px] px-2 py-1 rounded-md border transition-all", sortKey === 'distanceValue' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "border-white/5 text-zinc-500")}
              >
                Distance
              </button>
            </div>
          </div>
        )}

        {/* Results Section */}
        <section className="space-y-4">
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-200">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {sortedHotspots.map((spot) => (
                <motion.button
                  key={spot.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => {
                    setSelectedHotspot(selectedHotspot?.id === spot.id ? null : spot);
                    setRetrievalResult(null);
                  }}
                  className={cn(
                    "w-full text-left p-4 rounded-2xl border transition-all duration-200 group",
                    selectedHotspot?.id === spot.id 
                      ? "bg-emerald-500/10 border-emerald-500/30" 
                      : "bg-zinc-900/50 border-white/5 hover:border-white/10"
                  )}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center border transition-colors",
                        selectedHotspot?.id === spot.id ? "bg-emerald-500/20 border-emerald-500/40" : "bg-zinc-800 border-zinc-700"
                      )}>
                        {getTypeIcon(spot.type)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-zinc-100 flex items-center gap-2">
                          {spot.name}
                          {spot.security === 'Open' && <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded uppercase tracking-tighter">Free</span>}
                        </h3>
                        <p className="text-xs text-zinc-500 line-clamp-1">{spot.address}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getSignalIcon(spot.signalStrength)}
                      <span className="text-[10px] text-zinc-600 font-mono">{spot.distance}</span>
                    </div>
                  </div>

                  {selectedHotspot?.id === spot.id && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="mt-4 pt-4 border-t border-white/5 space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Security</p>
                          <div className="flex items-center gap-2">
                            {spot.security === 'Open' ? <Unlock className="w-3 h-3 text-emerald-400" /> : <Lock className="w-3 h-3 text-amber-400" />}
                            <span className="text-sm font-medium">{spot.security}</span>
                          </div>
                        </div>
                        <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                          <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Password Status</p>
                          <div className="flex items-center gap-2">
                            {retrievalResult?.password ? (
                              <span className="text-sm font-mono text-emerald-400 select-all">
                                {retrievalResult.password}
                              </span>
                            ) : (
                              <span className="text-xs text-zinc-500 italic">
                                {isRetrieving ? "Searching..." : "Not retrieved"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {retrievalResult && (
                        <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                          <p className="text-[11px] text-zinc-400 leading-tight">
                            {retrievalResult.message}
                          </p>
                        </div>
                      )}

                      {!retrievalResult && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRetrievePassword(spot);
                          }}
                          disabled={isRetrieving}
                          className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                          {isRetrieving ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Searching Community Database...
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4" />
                              Retrieve Shared Password
                            </>
                          )}
                        </button>
                      )}
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </AnimatePresence>

            {!isScanning && hotspots.length === 0 && !error && (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto border border-zinc-800">
                  <WifiOff className="w-8 h-8 text-zinc-700" />
                </div>
                <div className="space-y-1">
                  <p className="text-zinc-400 font-medium">No networks found</p>
                  <p className="text-zinc-600 text-xs">Try moving to a different location or scanning again.</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Privacy Modal */}
      <AnimatePresence>
        {showPrivacyNotice && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-zinc-900 border border-white/10 rounded-3xl p-8 max-w-sm w-full space-y-6"
            >
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Privacy & Ethics</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  NetScout is designed for ethical use. We only retrieve passwords that have been explicitly shared by the community for public locations.
                </p>
              </div>
              <ul className="space-y-3">
                {[
                  "No unauthorized access to private networks.",
                  "Community-sourced public passwords only.",
                  "Location data is used only for scanning.",
                  "Always use a VPN for public connections."
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-xs text-zinc-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => setShowPrivacyNotice(false)}
                className="w-full py-4 bg-zinc-100 hover:bg-white text-black font-bold rounded-2xl transition-colors"
              >
                I Understand
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <footer className="max-w-md mx-auto px-6 py-8 border-t border-white/5">
        <div className="flex items-start gap-3 p-4 bg-zinc-900/30 rounded-2xl border border-white/5">
          <Info className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            NetScout uses community-shared data and public records to identify Wi-Fi hotspots. 
            Passwords shown are provided by the community and may vary. 
            Always use a VPN when connecting to public networks.
          </p>
        </div>
      </footer>
    </div>
  );
}

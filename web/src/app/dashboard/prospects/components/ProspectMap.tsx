'use client';

import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import type { Prospect } from '@/types';

const typeColors: Record<string, string> = {
  pharmacie: '#3b82f6',
  depot: '#f97316',
  clinique: '#10b981',
  hopital: '#ef4444',
  autre: '#6b7280',
};

const typeLabels: Record<string, string> = {
  pharmacie: 'Pharmacie',
  depot: 'Dépôt',
  clinique: 'Clinique',
  hopital: 'Hôpital',
  autre: 'Autre',
};

interface Props {
  prospects: Prospect[];
  selectedProspect?: Prospect | null;
  onSelect?: (prospect: Prospect) => void;
}

export default function ProspectMap({ prospects, selectedProspect, onSelect }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let L: any;
    import('leaflet').then((mod) => {
      L = mod.default;
      if (!mapRef.current || mapInstanceRef.current) return;

      const map = L.map(mapRef.current, {
        center: [33.8869, 9.5375],
        zoom: 6,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !mapInstanceRef.current) return;

    import('leaflet').then((L) => {
      const map = mapInstanceRef.current;
      markersRef.current.forEach((m) => map.removeLayer(m));
      markersRef.current = [];

      const calibrated = prospects.filter((p) => p.estCalibre && p.latitude && p.longitude);
      if (calibrated.length === 0) return;

      const bounds: any[] = [];

      calibrated.forEach((p) => {
        const color = typeColors[p.type] || '#6b7280';
        const marker = L.default.marker([p.latitude!, p.longitude!], {
          icon: L.default.divIcon({
            className: 'custom-marker',
            html: `<div style="width:24px;height:24px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          }),
        });

        marker.bindPopup(`
          <div style="font-family:sans-serif;padding:4px;">
            <strong>${p.nom}</strong><br/>
            <span style="color:${color};font-size:12px;">${typeLabels[p.type] || p.type}</span><br/>
            ${p.ville}, ${p.region}
          </div>
        `);

        if (onSelect) {
          marker.on('click', () => onSelect(p));
        }

        marker.addTo(map);
        markersRef.current.push(marker);
        bounds.push([p.latitude, p.longitude]);
      });

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    });
  }, [prospects, selectedProspect, onSelect]);

  if (typeof window === 'undefined') {
    return <div className="h-[400px] rounded-lg border bg-gray-100 flex items-center justify-center text-gray-400">Carte</div>;
  }

  const calibratedCount = prospects.filter((p) => p.estCalibre).length;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {Object.entries(typeLabels).map(([key, label]) => (
          <Badge key={key} variant="outline" className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: typeColors[key] }} />
            {label}
          </Badge>
        ))}
      </div>
      <div ref={mapRef} className="h-[400px] rounded-lg border z-0" style={{ minHeight: '400px' }} />
      <p className="text-sm text-gray-500">
        {calibratedCount} / {prospects.length} prospects calibrés affichés sur la carte
      </p>
    </div>
  );
}

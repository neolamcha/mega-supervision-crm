'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Check, X } from 'lucide-react';
import type { ProspectTypeConfig } from '@/types';

interface TypeConfigCardProps {
  config: ProspectTypeConfig;
  icon: string;
  label: string;
  onUpdate: (data: Partial<ProspectTypeConfig>) => void;
}

export default function TypeConfigCard({ config, icon, label, onUpdate }: TypeConfigCardProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(config.rayonPresence.toString());

  const handleSave = () => {
    const num = parseInt(value, 10);
    if (num > 0) {
      onUpdate({ rayonPresence: num });
      setEditing(false);
    }
  };

  const handleCancel = () => {
    setValue(config.rayonPresence.toString());
    setEditing(false);
  };

  const radiusKm = (config.rayonPresence / 1000).toFixed(1);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{icon}</span>
            <div>
              <h3 className="font-semibold text-gray-900">{label}</h3>
              <p className="text-sm text-gray-500">{config.type}</p>
            </div>
          </div>
          {!editing && (
            <Button variant="ghost" size="icon" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="mt-4">
          {editing ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Rayon de présence (mètres)</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  min="1"
                  autoFocus
                />
                <Button size="icon" onClick={handleSave}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-primary">{config.rayonPresence}</span>
                  <span className="text-sm text-gray-500">m</span>
                </div>
                <p className="text-xs text-gray-400">≈ {radiusKm} km</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Pause</p>
                <p className="text-sm font-medium">{config.pauseStart} - {config.pauseEnd}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

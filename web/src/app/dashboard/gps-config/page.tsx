'use client';

import { useState, useEffect } from 'react';
import { prospects } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import TypeConfigCard from './components/TypeConfigCard';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ProspectTypeConfig } from '@/types';

export default function GpsConfigPage() {
  const [configs, setConfigs] = useState<ProspectTypeConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  const loadConfigs = async () => {
    setIsLoading(true);
    try {
      const data = await prospects.getTypeConfigs();
      setConfigs(data);
    } catch {
      addToast('Erreur lors du chargement', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadConfigs(); }, []);

  const handleUpdate = async (type: string, data: Partial<ProspectTypeConfig>) => {
    try {
      await prospects.updateTypeConfig(type, data);
      addToast('Configuration mise à jour', 'success');
      loadConfigs();
    } catch {
      addToast('Erreur lors de la mise à jour', 'error');
    }
  };

  const typeIcons: Record<string, string> = {
    pharmacie: '💊',
    depot: '📦',
    clinique: '🏥',
    hopital: '🏨',
    autre: '📌',
  };

  const typeLabels: Record<string, string> = {
    pharmacie: 'Pharmacie',
    depot: 'Dépôt',
    clinique: 'Clinique',
    hopital: 'Hôpital',
    autre: 'Autre',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuration GPS</h1>
          <p className="text-gray-500 mt-1">
            Paramètres des zones de présence par type de prospect
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={loadConfigs}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Zones de présence</CardTitle>
          <CardDescription>
            Configurez le rayon de présence (en mètres) pour chaque type de prospect. Pause systématique de 13h00 à 15h00.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {configs.map((config) => (
                <TypeConfigCard
                  key={config.type}
                  config={config}
                  icon={typeIcons[config.type] || '📌'}
                  label={typeLabels[config.type] || config.type}
                  onUpdate={(data) => handleUpdate(config.type, data)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pause déjeuner</CardTitle>
          <CardDescription>Plage horaire de pause pour tous les délégués</CardDescription>
        </CardHeader>
        <CardContent>
          {configs.length > 0 && (
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-3xl">☕</div>
              <div>
                <p className="font-medium text-gray-900">
                  Pause de {configs[0].pauseStart} à {configs[0].pauseEnd}
                </p>
                <p className="text-sm text-gray-500">
                  Aucune visite n&apos;est comptabilisée pendant cette période
                </p>
              </div>
            </div>
          )}
          {configs.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-4">
                <div className="text-3xl">ℹ️</div>
                <div>
                  <p className="font-medium text-gray-900">Fonctionnement</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Le rayon de présence définit la distance maximale autour du prospect dans laquelle
                    le délégué doit se trouver pour que la visite soit considérée comme valide.
                    Les visites en dehors de cette zone sont signalées comme anomalies.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

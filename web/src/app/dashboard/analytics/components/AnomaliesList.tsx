'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, MapPin, XCircle } from 'lucide-react';
import type { Anomaly } from '@/types';

const typeConfig: Record<string, { label: string; icon: any; color: string }> = {
  visite_courte: { label: 'Visite courte', icon: Clock, color: 'text-yellow-600 bg-yellow-100' },
  visite_longue: { label: 'Visite longue', icon: Clock, color: 'text-orange-600 bg-orange-100' },
  hors_zone: { label: 'Hors zone', icon: MapPin, color: 'text-red-600 bg-red-100' },
  pause_inattendue: { label: 'Pause inattendue', icon: XCircle, color: 'text-purple-600 bg-purple-100' },
  stop_sans_prospect: { label: 'Arrêt sans prospect', icon: AlertTriangle, color: 'text-red-600 bg-red-100' },
};

const severityLabels: Record<string, string> = {
  faible: 'Faible',
  moyenne: 'Moyenne',
  elevee: 'Élevée',
};

const severityVariants: Record<string, 'warning' | 'destructive' | 'default'> = {
  faible: 'warning',
  moyenne: 'default',
  elevee: 'destructive',
};

interface AnomaliesListProps {
  anomalies: Anomaly[];
}

export default function AnomaliesList({ anomalies }: AnomaliesListProps) {
  if (anomalies.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          Anomalies détectées
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {anomalies.map((anomaly) => {
            const config = typeConfig[anomaly.type] || { label: anomaly.type, icon: AlertTriangle, color: 'text-gray-600 bg-gray-100' };
            const Icon = config.icon;

            return (
              <div key={anomaly.id} className="flex items-start gap-4 p-4 hover:bg-gray-50">
                <div className={`p-2 rounded-lg ${config.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-900">{config.label}</span>
                    <Badge variant={severityVariants[anomaly.severite] || 'default'}>
                      {severityLabels[anomaly.severite] || anomaly.severite}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{anomaly.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(anomaly.date).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { analytics } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import FilterBar from './components/FilterBar';
import AnalyticsCharts from './components/AnalyticsCharts';
import AnomaliesList from './components/AnomaliesList';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DashboardAnalytics, Anomaly } from '@/types';

export default function AnalyticsPage() {
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateDebut, setDateDebut] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [dateFin, setDateFin] = useState(() => new Date().toISOString().split('T')[0]);
  const [delegateFilter, setDelegateFilter] = useState('');
  const { addToast } = useToast();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = { dateFrom: dateDebut, dateTo: dateFin };
      const anomalyParams: Record<string, string> = { ...params };
      if (delegateFilter) anomalyParams.delegateId = delegateFilter;
      const [dashboardData, anomalyData] = await Promise.all([
        analytics.getDashboard(params),
        analytics.getAnomalies(anomalyParams),
      ]);
      setData(dashboardData);
      setAnomalies(anomalyData);
    } catch {
      addToast('Erreur lors du chargement', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [dateDebut, dateFin, delegateFilter, addToast]);

  useEffect(() => { loadData(); }, [loadData]);

  const kpiItems = [
    {
      title: 'Total visites',
      value: data?.totalVisits ?? 0,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Temps terrain',
      value: data?.totalTerrainTime ? `${Math.round(data.totalTerrainTime / 60)}h` : '0h',
      icon: MapPin,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Temps prospect',
      value: data?.totalProspectTime ? `${Math.round(data.totalProspectTime / 60)}h` : '0h',
      icon: CheckCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Temps perdu',
      value: data?.lostTime ? `${Math.round(data.lostTime / 60)}h` : '0h',
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Durée moyenne',
      value: data?.averageVisitDuration ? `${Math.round(data.averageVisitDuration)} min` : '0 min',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Anomalies',
      value: anomalies.length,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytiques</h1>
          <p className="text-gray-500 mt-1">Analyses détaillées de l&apos;activité</p>
        </div>
        <Button variant="outline" size="icon" onClick={loadData}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <FilterBar
        dateDebut={dateDebut}
        dateFin={dateFin}
        onDateDebutChange={setDateDebut}
        onDateFinChange={setDateFin}
        delegateFilter={delegateFilter}
        onDelegateFilterChange={setDelegateFilter}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpiItems.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="pb-2 px-4 pt-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium text-gray-500">{kpi.title}</CardTitle>
                <div className={`p-1.5 rounded-lg ${kpi.bgColor}`}>
                  <kpi.icon className={`h-3 w-3 ${kpi.color}`} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <div className="text-xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <>
          <AnalyticsCharts data={data} anomalies={anomalies} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Prospects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg flex-1">
                    <p className="text-2xl font-bold text-green-600">{data?.prospectsVisited ?? 0}</p>
                    <p className="text-sm text-green-700">Visités</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg flex-1">
                    <p className="text-2xl font-bold text-red-600">{data?.prospectsNotVisited ?? 0}</p>
                    <p className="text-sm text-red-700">Non visités</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top délégués</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Délégué</TableHead>
                      <TableHead className="text-right">Visites</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data as any)?.topDelegates?.slice(0, 5).map((td: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell>
                          <span className="font-medium">
                            {td.delegate?.prenom} {td.delegate?.nom}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">{td.totalVisites}</Badge>
                        </TableCell>
                      </TableRow>
                    )) || (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-gray-500">
                          Aucune donnée
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {anomalies.length > 0 && <AnomaliesList anomalies={anomalies} />}
        </>
      )}
    </div>
  );
}

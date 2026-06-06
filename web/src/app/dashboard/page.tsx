'use client';

import { useState, useEffect } from 'react';
import { analytics } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Users,
  Building2,
  Clock,
  Activity,
  TrendingUp,
  MapPin,
  FileText,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { formatDate } from '@/lib/utils';
import type { DashboardAnalytics } from '@/types';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const result = await analytics.getDashboard();
      setData(result);
    } catch {
      // Error handled silently
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total visites',
      value: data?.totalVisits ?? 0,
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Délégués actifs',
      value: 0,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Prospects visités',
      value: data?.prospectsVisited ?? 0,
      icon: Building2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Durée moyenne',
      value: data?.averageVisitDuration ? `${Math.round(data.averageVisitDuration)} sec` : '0',
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  const quickLinks = [
    { title: 'Délégués', href: '/dashboard/delegates', icon: Users, description: 'Gérer les délégués' },
    { title: 'Prospects', href: '/dashboard/prospects', icon: Building2, description: 'Gérer les prospects' },
    { title: 'Configuration GPS', href: '/dashboard/gps-config', icon: MapPin, description: 'Paramètres des zones' },
    { title: 'Analytiques', href: '/dashboard/analytics', icon: BarChart3, description: 'Analyses détaillées' },
    { title: 'Rapports PDF', href: '/dashboard/reports', icon: FileText, description: 'Générer des rapports' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500 mt-1">Vue d&apos;ensemble de l&apos;activité</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{kpi.title}</CardTitle>
              <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Visites des 7 derniers jours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.visitesParJour || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => formatDate(d, 'EEE')}
                    stroke="#888"
                    fontSize={12}
                  />
                  <YAxis stroke="#888" fontSize={12} />
                  <Tooltip
                    labelFormatter={(d) => formatDate(d, 'dd/MM/yyyy')}
                    formatter={(value: number) => [value, 'Visites']}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#1e40af"
                    strokeWidth={2}
                    dot={{ fill: '#1e40af', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Répartition par type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.visitesParType || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" stroke="#888" fontSize={12} />
                  <YAxis dataKey="type" type="category" stroke="#888" fontSize={12} width={80} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1e40af" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Accès rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant="outline"
                  className="w-full h-auto flex flex-col items-center gap-2 py-6"
                >
                  <link.icon className="h-6 w-6 text-primary" />
                  <div className="text-center">
                    <div className="font-medium text-sm">{link.title}</div>
                    <div className="text-xs text-gray-500">{link.description}</div>
                  </div>
                  <ArrowRight className="h-3 w-3 text-gray-400" />
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

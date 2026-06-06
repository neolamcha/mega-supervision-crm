'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { DashboardAnalytics, Anomaly } from '@/types';

const COLORS = ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'];
const PIE_COLORS = ['#1e40af', '#3b82f6', '#f97316', '#ef4444', '#8b5cf6', '#10b981'];

interface AnalyticsChartsProps {
  data: DashboardAnalytics | null;
  anomalies: Anomaly[];
}

export default function AnalyticsCharts({ data }: AnalyticsChartsProps) {
  const visitTypeData = data?.visitesParType?.map((v) => ({
    name: v.type,
    value: v.count,
  })) || [];

  const topDelegatesData = data?.topDelegates?.slice(0, 5).map((td) => ({
    name: `${td.delegate?.prenom || ''} ${td.delegate?.nom || ''}`,
    visites: td.totalVisites,
  })) || [];

  const timeData = [
    { name: 'Terrain', value: data?.totalTerrainTime || 0 },
    { name: 'Prospect', value: data?.totalProspectTime || 0 },
    { name: 'Perdu', value: data?.lostTime || 0 },
  ].filter((d) => d.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Visites par jour</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.visitesParJour || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#888" fontSize={12} tickFormatter={(d) => {
                  const date = new Date(d);
                  return `${date.getDate()}/${date.getMonth() + 1}`;
                }} />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#1e40af" strokeWidth={2}
                  dot={{ fill: '#1e40af', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Visites par type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={visitTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {visitTypeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top délégués</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topDelegatesData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" stroke="#888" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#888" fontSize={12} width={100} />
                <Tooltip />
                <Bar dataKey="visites" fill="#1e40af" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {timeData.length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Répartition du temps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} />
                  <Tooltip formatter={(value: number) => `${Math.round(value / 60)}h`} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {timeData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { pdf as pdfApi, users } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Loader2, Calendar, User } from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';
import type { User as UserType, PdfReport } from '@/types';

export default function ReportsPage() {
  const [delegates, setDelegates] = useState<UserType[]>([]);
  const [reports, setReports] = useState<PdfReport[]>([]);
  const [selectedDelegate, setSelectedDelegate] = useState('');
  const [dateDebut, setDateDebut] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [dateFin, setDateFin] = useState(() => new Date().toISOString().split('T')[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    Promise.all([
      users.list({ role: 'delegue' }),
      pdfApi.list(),
    ]).then(([usersData, reportsData]) => {
      setDelegates(usersData);
      setReports(reportsData);
    }).catch(() => {
      addToast('Erreur lors du chargement', 'error');
    }).finally(() => setIsLoading(false));
  }, [addToast]);

  const handleGenerate = async () => {
    if (!selectedDelegate) {
      addToast('Veuillez sélectionner un délégué', 'warning');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await pdfApi.generate(selectedDelegate, dateDebut, dateFin);
      addToast('Rapport généré avec succès', 'success');
      setReports((prev) => [
        {
          filename: result.filename,
          delegateNom: '',
          delegatePrenom: '',
          dateDebut,
          dateFin,
          dateGeneration: new Date().toISOString(),
          taille: 0,
        },
        ...prev,
      ]);
    } catch {
      addToast('Erreur lors de la génération', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const delegateOptions = delegates.map((d) => ({
    value: d.id,
    label: `${d.prenom} ${d.nom}`,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rapports PDF</h1>
        <p className="text-gray-500 mt-1">Génération de rapports d&apos;activité</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Générer un rapport</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                <User className="h-3 w-3" /> Délégué
              </label>
              <Select
                options={delegateOptions}
                placeholder="Sélectionner un délégué"
                value={selectedDelegate}
                onChange={(e) => setSelectedDelegate(e.target.value)}
                className="w-56"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Date début
              </label>
              <Input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Date fin
              </label>
              <Input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                className="w-40"
              />
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating || !selectedDelegate}>
              {isGenerating ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Génération...</>
              ) : (
                <><FileText className="h-4 w-4 mr-2" /> Générer le rapport</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rapports générés</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : reports.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucun rapport généré</p>
            </div>
          ) : (
            <div className="divide-y">
              {reports.map((report) => (
                <div key={report.filename} className="flex items-center justify-between p-4 hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900">
                        Rapport {report.delegatePrenom} {report.delegateNom}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(report.dateDebut)} - {formatDate(report.dateFin)}
                      </p>
                      <p className="text-xs text-gray-400">
                        Généré le {formatDateTime(report.dateGeneration)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {report.taille > 0 && (
                      <Badge variant="secondary">
                        {report.taille > 1024
                          ? `${(report.taille / 1024).toFixed(1)} Mo`
                          : `${report.taille} Ko`}
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(pdfApi.download(report.filename), '_blank')}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Télécharger
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

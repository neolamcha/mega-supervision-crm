'use client';

import { useState, useEffect } from 'react';
import { prospects } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import ProspectForm from './components/ProspectForm';
import ProspectTable from './components/ProspectTable';
import ProspectMap from './components/ProspectMap';
import { Plus, MapIcon, TableIcon, RefreshCw, Download, Search } from 'lucide-react';
import type { Prospect } from '@/types';

export default function ProspectsPage() {
  const [prospectsList, setProspectsList] = useState<Prospect[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [archiveFilter, setArchiveFilter] = useState('');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'table' | 'map'>('table');
  const { addToast } = useToast();

  useEffect(() => { loadProspects(); }, []);

  const loadProspects = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (typeFilter) params.type = typeFilter;
      if (regionFilter) params.region = regionFilter;
      if (archiveFilter) params.archive = archiveFilter;
      if (search) params.search = search;

      const data = await prospects.list(params);
      setProspectsList(data);
    } catch {
      addToast('Erreur lors du chargement', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleArchive = async (prospect: Prospect) => {
    try {
      if (prospect.estArchive) {
        await prospects.unarchive(prospect.id);
        addToast('Prospect désarchivé', 'success');
      } else {
        await prospects.archive(prospect.id);
        addToast('Prospect archivé', 'success');
      }
      loadProspects();
    } catch {
      addToast('Erreur lors de la mise à jour', 'error');
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingProspect(null);
    loadProspects();
  };

  const regions = Array.from(new Set(prospectsList.map((p) => p.region).filter(Boolean)));
  const types = Array.from(new Set(prospectsList.map((p) => p.type)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prospects</h1>
          <p className="text-gray-500 mt-1">Gestion des prospects commerciaux</p>
        </div>
        <Button onClick={() => { setEditingProspect(null); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un prospect
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Input
                placeholder="Rechercher par nom..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            <Select
              options={types.map((t) => ({ value: t, label: t }))}
              placeholder="Tous les types"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-44"
            />
            <Select
              options={regions.map((r) => ({ value: r, label: r }))}
              placeholder="Toutes les régions"
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="w-44"
            />
            <Select
              options={[
                { value: 'false', label: 'Actifs' },
                { value: 'true', label: 'Archivés' },
              ]}
              placeholder="Tous"
              value={archiveFilter}
              onChange={(e) => setArchiveFilter(e.target.value)}
              className="w-36"
            />
            <Button variant="outline" size="icon" onClick={loadProspects}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <div className="ml-auto flex gap-1">
              <Button
                variant={view === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('table')}
              >
                <TableIcon className="h-4 w-4 mr-1" />
                Tableau
              </Button>
              <Button
                variant={view === 'map' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('map')}
              >
                <MapIcon className="h-4 w-4 mr-1" />
                Carte
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : view === 'table' ? (
            <ProspectTable
              prospects={prospectsList}
              onEdit={(p) => { setEditingProspect(p); setShowForm(true); }}
              onToggleArchive={handleToggleArchive}
              onViewOnMap={(p) => setView('map')}
            />
          ) : (
            <div className="h-[600px]">
              <ProspectMap prospects={prospectsList} />
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingProspect ? 'Modifier le prospect' : 'Ajouter un prospect'}</DialogTitle>
            <DialogClose onClose={() => { setShowForm(false); setEditingProspect(null); }} />
          </DialogHeader>
          <ProspectForm
            prospect={editingProspect}
            onSuccess={handleFormSuccess}
            onCancel={() => { setShowForm(false); setEditingProspect(null); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

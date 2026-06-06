'use client';

import { useState, useEffect } from 'react';
import { users } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import DelegateForm from './components/DelegateForm';
import { Plus, Search, Pencil, RefreshCw, UserX, UserCheck, KeyRound } from 'lucide-react';
import type { User } from '@/types';

export default function DelegatesPage() {
  const [delegates, setDelegates] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingDelegate, setEditingDelegate] = useState<User | null>(null);
  const [resetPasswordFor, setResetPasswordFor] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const { addToast } = useToast();

  useEffect(() => { loadDelegates(); }, []);

  const loadDelegates = async () => {
    setIsLoading(true);
    try {
      const data = await users.list({ role: 'delegue' });
      setDelegates(data);
    } catch {
      addToast('Erreur lors du chargement', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (delegate: User) => {
    try {
      if (delegate.estActif) {
        await users.delete(delegate.id);
        addToast('Délégué désactivé', 'success');
      } else {
        await users.reactivate(delegate.id);
        addToast('Délégué réactivé', 'success');
      }
      loadDelegates();
    } catch {
      addToast('Erreur lors de la mise à jour', 'error');
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordFor) return;
    try {
      const result = await users.resetPassword(resetPasswordFor.id);
      setNewPassword(result.temporaryPassword);
      addToast('Mot de passe réinitialisé', 'success');
    } catch {
      addToast('Erreur lors de la réinitialisation', 'error');
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingDelegate(null);
    loadDelegates();
  };

  const filtered = delegates.filter(
    (d) =>
      d.nom.toLowerCase().includes(search.toLowerCase()) ||
      d.prenom.toLowerCase().includes(search.toLowerCase()) ||
      d.email.toLowerCase().includes(search.toLowerCase()) ||
      d.login.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Délégués</h1>
          <p className="text-gray-500 mt-1">Gestion des délégués commerciaux</p>
        </div>
        <Button onClick={() => { setEditingDelegate(null); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un délégué
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon" onClick={loadDelegates}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Prénom</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Login</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((delegate) => (
                  <TableRow key={delegate.id}>
                    <TableCell className="font-medium">{delegate.nom}</TableCell>
                    <TableCell>{delegate.prenom}</TableCell>
                    <TableCell>{delegate.telephone}</TableCell>
                    <TableCell>{delegate.email}</TableCell>
                    <TableCell>{delegate.login}</TableCell>
                    <TableCell>
                      <Badge variant={delegate.estActif ? 'success' : 'destructive'}>
                        {delegate.estActif ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setEditingDelegate(delegate); setShowForm(true); }}
                          title="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleStatus(delegate)}
                          title={delegate.estActif ? 'Désactiver' : 'Réactiver'}
                        >
                          {delegate.estActif ? (
                            <UserX className="h-4 w-4 text-red-500" />
                          ) : (
                            <UserCheck className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setResetPasswordFor(delegate)}
                          title="Réinitialiser mot de passe"
                        >
                          <KeyRound className="h-4 w-4 text-orange-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Aucun délégué trouvé
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDelegate ? 'Modifier le délégué' : 'Ajouter un délégué'}</DialogTitle>
            <DialogClose onClose={() => { setShowForm(false); setEditingDelegate(null); }} />
          </DialogHeader>
          <DelegateForm
            delegate={editingDelegate}
            onSuccess={handleFormSuccess}
            onCancel={() => { setShowForm(false); setEditingDelegate(null); }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!resetPasswordFor} onOpenChange={(o) => { if (!o) setResetPasswordFor(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
            <DialogClose onClose={() => setResetPasswordFor(null)} />
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Nouveau mot de passe pour {resetPasswordFor?.prenom} {resetPasswordFor?.nom}
            </p>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nouveau mot de passe"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setResetPasswordFor(null)}>Annuler</Button>
              <Button onClick={handleResetPassword} disabled={!newPassword}>Réinitialiser</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

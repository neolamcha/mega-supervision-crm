'use client';

import { useState } from 'react';
import { auth, audit } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Shield, KeyRound, Clock, History } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import type { AuditLog } from '@/types';

export default function SettingsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Tous les champs sont obligatoires');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }

    setIsChangingPassword(true);
    try {
      await auth.changePassword(currentPassword, newPassword, confirmPassword);
      addToast('Mot de passe modifié avec succès', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err?.message || 'Erreur lors du changement');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const loadLogs = async () => {
    setLogsLoading(true);
    try {
      const data = await audit.list();
      setLogs(data);
    } catch {
      addToast('Erreur lors du chargement', 'error');
    } finally {
      setLogsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mon Compte</h1>
        <p className="text-gray-500 mt-1">Paramètres et informations personnelles</p>
      </div>

      <Tabs value="account" onValueChange={(v) => { if (v === 'audit') loadLogs(); }}>
        <TabsList>
          <TabsTrigger value="account">
            <User className="h-4 w-4 mr-2" />
            Informations
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Sécurité
          </TabsTrigger>
          <TabsTrigger value="audit">
            <History className="h-4 w-4 mr-2" />
            Journal d&apos;audit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations personnelles</CardTitle>
              <CardDescription>Vos informations de compte</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nom</label>
                  <p className="text-gray-900 mt-1">{user?.nom || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Prénom</label>
                  <p className="text-gray-900 mt-1">{user?.prenom || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900 mt-1">{user?.email || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Téléphone</label>
                  <p className="text-gray-900 mt-1">{user?.telephone || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Login</label>
                  <p className="text-gray-900 mt-1">{user?.login || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Rôle</label>
                  <p className="mt-1">
                    <Badge variant="secondary">
                      {user?.role === 'directeur' ? 'Directeur Commercial' : user?.role}
                    </Badge>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Changer le mot de passe</CardTitle>
              <CardDescription>Modifiez votre mot de passe</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                {passwordError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                    {passwordError}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Mot de passe actuel</label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Votre mot de passe actuel"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Nouveau mot de passe</label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 caractères"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Confirmer le mot de passe</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirmer le mot de passe"
                  />
                </div>

                <Button type="submit" disabled={isChangingPassword}>
                  <KeyRound className="h-4 w-4 mr-2" />
                  {isChangingPassword ? 'Changement...' : 'Changer le mot de passe'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Journal d&apos;audit</CardTitle>
              <CardDescription>Historique des actions sur votre compte</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {logsLoading ? (
                <div className="p-6 space-y-3">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : logs.length === 0 ? (
                <div className="p-12 text-center">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Aucune activité enregistrée</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Détails</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.action}</TableCell>
                        <TableCell className="text-sm text-gray-600">{typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}</TableCell>
                        <TableCell className="text-sm text-gray-500">{log.adresseIP}</TableCell>
                        <TableCell className="text-sm text-gray-500">{formatDateTime(log.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Pencil, UserX, UserCheck, KeyRound, Search } from 'lucide-react';
import type { User } from '@/types';

interface DelegateTableProps {
  delegates: User[];
  onEdit: (delegate: User) => void;
  onToggleStatus: (delegate: User) => void;
  onResetPassword: (delegate: User) => void;
}

export default function DelegateTable({
  delegates,
  onEdit,
  onToggleStatus,
  onResetPassword,
}: DelegateTableProps) {
  const [search, setSearch] = useState('');

  const filtered = delegates.filter(
    (d) =>
      d.nom.toLowerCase().includes(search.toLowerCase()) ||
      d.prenom.toLowerCase().includes(search.toLowerCase()) ||
      d.email.toLowerCase().includes(search.toLowerCase()) ||
      d.login.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="p-4 border-b">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
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
                  <Button variant="ghost" size="icon" onClick={() => onEdit(delegate)} title="Modifier">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onToggleStatus(delegate)}
                    title={delegate.estActif ? 'Désactiver' : 'Réactiver'}>
                    {delegate.estActif ? (
                      <UserX className="h-4 w-4 text-red-500" />
                    ) : (
                      <UserCheck className="h-4 w-4 text-green-500" />
                    )}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onResetPassword(delegate)} title="Réinitialiser">
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
    </div>
  );
}

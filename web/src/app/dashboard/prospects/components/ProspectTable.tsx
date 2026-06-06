'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Pencil, Archive, RotateCcw, MapPin } from 'lucide-react';
import type { Prospect } from '@/types';

const typeLabels: Record<string, string> = {
  pharmacie: 'Pharmacie',
  depot: 'Dépôt',
  clinique: 'Clinique',
  hopital: 'Hôpital',
  autre: 'Autre',
};

interface ProspectTableProps {
  prospects: Prospect[];
  onEdit: (prospect: Prospect) => void;
  onToggleArchive: (prospect: Prospect) => void;
  onViewOnMap: (prospect: Prospect) => void;
}

export default function ProspectTable({ prospects, onEdit, onToggleArchive, onViewOnMap }: ProspectTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nom</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Ville</TableHead>
          <TableHead>Région</TableHead>
          <TableHead>Calibré</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {prospects.map((prospect) => (
          <TableRow key={prospect.id} className={prospect.estArchive ? 'opacity-60' : ''}>
            <TableCell className="font-medium">{prospect.nom}</TableCell>
            <TableCell>
              <Badge variant="outline">{typeLabels[prospect.type] || prospect.type}</Badge>
            </TableCell>
            <TableCell>{prospect.ville}</TableCell>
            <TableCell>{prospect.region || '-'}</TableCell>
            <TableCell>
              <Badge variant={prospect.estCalibre ? 'success' : 'warning'}>
                {prospect.estCalibre ? 'Oui' : 'Non'}
              </Badge>
            </TableCell>
            <TableCell>
              {prospect.estArchive ? (
                <Badge variant="destructive">Archivé</Badge>
              ) : (
                <Badge variant="success">Actif</Badge>
              )}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="icon" onClick={() => onEdit(prospect)} title="Modifier">
                  <Pencil className="h-4 w-4" />
                </Button>
                {prospect.latitude && prospect.longitude && (
                  <Button variant="ghost" size="icon" onClick={() => onViewOnMap(prospect)} title="Voir sur la carte">
                    <MapPin className="h-4 w-4 text-blue-500" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onToggleArchive(prospect)}
                  title={prospect.estArchive ? 'Désarchiver' : 'Archiver'}
                >
                  {prospect.estArchive ? (
                    <RotateCcw className="h-4 w-4 text-green-500" />
                  ) : (
                    <Archive className="h-4 w-4 text-orange-500" />
                  )}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        {prospects.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-8 text-gray-500">
              Aucun prospect trouvé
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

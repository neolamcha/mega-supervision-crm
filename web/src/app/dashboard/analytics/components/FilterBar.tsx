'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Calendar, User } from 'lucide-react';

interface FilterBarProps {
  dateDebut: string;
  dateFin: string;
  onDateDebutChange: (value: string) => void;
  onDateFinChange: (value: string) => void;
  delegateFilter: string;
  onDelegateFilterChange: (value: string) => void;
}

export default function FilterBar({
  dateDebut,
  dateFin,
  onDateDebutChange,
  onDateFinChange,
  delegateFilter,
  onDelegateFilterChange,
}: FilterBarProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="dateDebut" className="text-xs font-medium text-gray-500 flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Date début
            </Label>
            <Input
              id="dateDebut"
              type="date"
              value={dateDebut}
              onChange={(e) => onDateDebutChange(e.target.value)}
              className="w-44"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dateFin" className="text-xs font-medium text-gray-500 flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Date fin
            </Label>
            <Input
              id="dateFin"
              type="date"
              value={dateFin}
              onChange={(e) => onDateFinChange(e.target.value)}
              className="w-44"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="delegate" className="text-xs font-medium text-gray-500 flex items-center gap-1">
              <User className="h-3 w-3" /> Délégué
            </Label>
            <Select
              id="delegate"
              options={[
                { value: '', label: 'Tous les délégués' },
                { value: '1', label: 'Exemple Délégué' },
              ]}
              placeholder="Tous les délégués"
              value={delegateFilter}
              onChange={(e) => onDelegateFilterChange(e.target.value)}
              className="w-52"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

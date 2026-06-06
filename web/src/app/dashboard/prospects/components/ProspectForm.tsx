'use client';

import { useState, type FormEvent } from 'react';
import { prospects } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type { Prospect, ProspectType } from '@/types';

const prospectTypes: { value: ProspectType; label: string }[] = [
  { value: 'pharmacie', label: 'Pharmacie' },
  { value: 'depot', label: 'Dépôt' },
  { value: 'clinique', label: 'Clinique' },
  { value: 'hopital', label: 'Hôpital' },
  { value: 'autre', label: 'Autre' },
];

interface ProspectFormProps {
  prospect: Prospect | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ProspectForm({ prospect, onSuccess, onCancel }: ProspectFormProps) {
  const [nom, setNom] = useState(prospect?.nom || '');
  const [type, setType] = useState<ProspectType>(prospect?.type || 'pharmacie');
  const [adresse, setAdresse] = useState(prospect?.adresse || '');
  const [ville, setVille] = useState(prospect?.ville || '');
  const [region, setRegion] = useState(prospect?.region || '');
  const [telephone, setTelephone] = useState(prospect?.telephone || '');
  const [notes, setNotes] = useState(prospect?.notes || '');
  const [latitude, setLatitude] = useState(prospect?.latitude?.toString() || '');
  const [longitude, setLongitude] = useState(prospect?.longitude?.toString() || '');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nom || !adresse || !ville) {
      setError('Le nom, l\'adresse et la ville sont obligatoires');
      return;
    }

    setIsLoading(true);
    try {
      const data = {
        nom,
        type,
        adresse,
        ville,
        region,
        telephone: telephone || undefined,
        notes: notes || undefined,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
      };

      if (prospect) {
        await prospects.update(prospect.id, data);
        addToast('Prospect modifié avec succès', 'success');
      } else {
        await prospects.create(data);
        addToast('Prospect créé avec succès', 'success');
      }
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Nom *</label>
          <Input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom du prospect" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Type</label>
          <Select
            options={prospectTypes}
            value={type}
            onChange={(e) => setType(e.target.value as ProspectType)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Adresse *</label>
        <Input value={adresse} onChange={(e) => setAdresse(e.target.value)} placeholder="Adresse" required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Ville *</label>
          <Input value={ville} onChange={(e) => setVille(e.target.value)} placeholder="Ville" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Région</label>
          <Input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Région" />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Téléphone</label>
        <Input value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="Téléphone" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Latitude</label>
          <Input value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="Latitude" type="number" step="any" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Longitude</label>
          <Input value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="Longitude" type="number" step="any" />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes..."
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Enregistrement...' : prospect ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  );
}

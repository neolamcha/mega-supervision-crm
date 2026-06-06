'use client';

import { useState, type FormEvent } from 'react';
import { users } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { User } from '@/types';

interface DelegateFormProps {
  delegate: User | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function DelegateForm({ delegate, onSuccess, onCancel }: DelegateFormProps) {
  const [nom, setNom] = useState(delegate?.nom || '');
  const [prenom, setPrenom] = useState(delegate?.prenom || '');
  const [telephone, setTelephone] = useState(delegate?.telephone || '');
  const [email, setEmail] = useState(delegate?.email || '');
  const [login, setLogin] = useState(delegate?.login || '');
  const [motDePasse, setMotDePasse] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nom || !prenom || !telephone || !email || !login) {
      setError('Tous les champs obligatoires doivent être remplis');
      return;
    }

    if (!delegate && !motDePasse) {
      setError('Le mot de passe est requis pour un nouveau délégué');
      return;
    }

    setIsLoading(true);
    try {
      const data = { nom, prenom, telephone, email, login, motDePasse: motDePasse || undefined };
      if (delegate) {
        await users.update(delegate.id, data);
        addToast('Délégué modifié avec succès', 'success');
      } else {
        await users.create({ ...data, role: 'delegue' });
        addToast('Délégué créé avec succès', 'success');
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
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Nom *</label>
          <Input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Prénom *</label>
          <Input value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Prénom" required />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Téléphone *</label>
        <Input value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="Téléphone" required />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Email *</label>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" required />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Login *</label>
        <Input value={login} onChange={(e) => setLogin(e.target.value)} placeholder="Identifiant" required />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          {delegate ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe *'}
        </label>
        <Input
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          placeholder="Mot de passe"
          type="password"
          required={!delegate}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Enregistrement...' : delegate ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  );
}

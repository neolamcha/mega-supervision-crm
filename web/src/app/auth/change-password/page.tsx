'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyRound, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ChangePasswordPage() {
  const [ancienMotDePasse, setAncienMotDePasse] = useState('');
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');
  const [confirmMotDePasse, setConfirmMotDePasse] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const validate = (): string | null => {
    if (!ancienMotDePasse) return 'Veuillez saisir votre mot de passe actuel';
    if (!nouveauMotDePasse) return 'Veuillez saisir un nouveau mot de passe';
    if (nouveauMotDePasse.length < 8) return 'Le nouveau mot de passe doit contenir au moins 8 caractères';
    if (nouveauMotDePasse === ancienMotDePasse) return 'Le nouveau mot de passe doit être différent de l\'ancien';
    if (nouveauMotDePasse !== confirmMotDePasse) return 'Les mots de passe ne correspondent pas';
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      await auth.changePassword(ancienMotDePasse, nouveauMotDePasse, confirmMotDePasse);
      setSuccess(true);
      setTimeout(() => {
        router.push('/auth');
      }, 3000);
    } catch (err: any) {
      setError(err?.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Mot de passe changé !</h2>
            <p className="text-gray-500 mb-6">
              Votre mot de passe a été modifié avec succès. Vous allez être redirigé vers la page de connexion.
            </p>
            <Button onClick={() => router.push('/auth')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la connexion
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
              <KeyRound className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Changer le mot de passe</CardTitle>
          <CardDescription>
            Première connexion : veuillez définir un nouveau mot de passe
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Mot de passe actuel</label>
              <Input
                type="password"
                value={ancienMotDePasse}
                onChange={(e) => setAncienMotDePasse(e.target.value)}
                placeholder="Votre mot de passe actuel"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Nouveau mot de passe</label>
              <Input
                type="password"
                value={nouveauMotDePasse}
                onChange={(e) => setNouveauMotDePasse(e.target.value)}
                placeholder="Minimum 8 caractères"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Confirmer le mot de passe</label>
              <Input
                type="password"
                value={confirmMotDePasse}
                onChange={(e) => setConfirmMotDePasse(e.target.value)}
                placeholder="Confirmer le nouveau mot de passe"
                required
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? 'Changement en cours...' : 'Changer le mot de passe'}
            </Button>

            <div className="text-center">
              <Link href="/auth" className="text-sm text-primary hover:underline">
                Retour à la connexion
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

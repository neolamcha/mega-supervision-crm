'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Smartphone,
  MapPin,
  CheckCircle2,
  Shield,
  BarChart3,
  Download,
  Eye,
  EyeOff,
  Building2,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';

function LoginModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login: authLogin } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const result = await authLogin(login, password);
      onClose();
      if (result.premierConnexion) {
        router.push('/auth/change-password');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err?.message || 'Identifiants incorrects');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative animate-in fade-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Espace Directeur Commercial</h2>
          <p className="text-gray-500 mt-1">Connectez-vous pour accéder au tableau de bord</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">{error}</div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Identifiant</label>
            <Input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="Votre identifiant"
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Mot de passe</label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white shadow-lg" size="lg" disabled={isLoading}>
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [showLogin, setShowLogin] = useState(false);

  const features = [
    { icon: MapPin, title: 'Géo-localisation Précise', desc: 'Suivi GPS en temps réel avec rayon de détection de 4 mètres' },
    { icon: CheckCircle2, title: 'Calibrage Intelligent', desc: 'Calibrage physique obligatoire pour chaque prospect' },
    { icon: Shield, title: 'Anti-Fraude', desc: 'Validation automatique du passage sur site' },
    { icon: BarChart3, title: 'Analytique Avancée', desc: 'Tableaux de bord interactifs et rapports PDF' },
  ];

  const stats = [
    { value: '4m', label: 'Rayon de détection' },
    { value: 'Offline', label: 'Mode hors-ligne' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-md">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">Mega Supervision</span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" className="hidden sm:flex items-center gap-2" onClick={() => setShowLogin(true)}>
                <Building2 className="h-4 w-4" />
                Directeur Commercial
              </Button>
              <Button className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-md hover:shadow-lg" onClick={() => setShowLogin(true)}>
                Connexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-100" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-br from-blue-400/20 to-blue-600/10 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                <Shield className="h-4 w-4" /> Solution CRM nouvelle génération
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight">
                Pilotez votre équipe
                <span className="block bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">terrain en temps réel</span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 max-w-xl">
                Mega Supervision vous offre une visibilité totale sur l&apos;activité de vos délégués commerciaux 
                avec une précision géographique inégalée.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white shadow-lg rounded-xl px-8 py-6 text-lg" onClick={() => setShowLogin(true)}>
                  Accéder au Dashboard
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="rounded-xl px-8 py-6 text-lg border-2" onClick={() => document.getElementById('app-mobile')?.scrollIntoView({ behavior: 'smooth' })}>
                  <Download className="mr-2 h-5 w-5" />
                  Télécharger l&apos;App
                </Button>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="relative w-full aspect-square max-w-md mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl rotate-6 opacity-10" />
                <div className="relative bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                  <div className="space-y-6">
                    <p className="text-xs text-gray-400 text-center uppercase tracking-wider">Aperçu du tableau de bord</p>
                    <div className="flex items-center gap-4 p-4 bg-green-50 rounded-2xl border border-green-100">
                      <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
                        <MapPin className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-green-600 font-medium">Visite en cours</p>
                        <p className="text-lg font-bold text-gray-900">Pharmacie Centrale</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {stats.map((s, i) => (
                        <div key={i} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-center">
                          <p className="text-2xl font-bold text-blue-600">{s.value}</p>
                          <p className="text-xs text-gray-500">{s.label}</p>
                        </div>
                      ))}
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Features */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Une solution complète pour votre force de vente
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Du calibrage GPS à l&apos;analyse des performances, Mega Supervision automatise 
              le suivi de vos délégués commerciaux.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <div key={i} className="group p-6 rounded-2xl bg-white border border-gray-100 hover:shadow-xl hover:border-blue-100 transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center mb-5 group-hover:from-blue-500 group-hover:to-blue-600 transition-colors duration-300">
                  <f.icon className="h-7 w-7 text-blue-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Mobile Download */}
      <section id="app-mobile" className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                <Smartphone className="h-4 w-4" /> Application Mobile
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                L&apos;application terrain<br />
                <span className="text-blue-600">de vos délégués</span>
              </h2>
              <ul className="space-y-4">
                {[
                  'Calibrage GPS des prospects en un clic',
                  'Détection automatique des visites (rayon 4m)',
                  'Mode hors-ligne : travaillez sans internet',
                  'Synchronisation automatique à la reconnexion',
                  'Historique complet des visites et déplacements',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-4 pt-4">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white shadow-lg rounded-xl px-8" onClick={() => window.open('https://github.com/neolamcha/mega-supervision-crm/releases/download/v1.0.0/MegaSupervision-v1.0.0.apk', '_blank')}>
                  <Download className="mr-2 h-5 w-5" />
                  Télécharger l&apos;APK Android
                </Button>
                <Button size="lg" variant="outline" className="rounded-xl px-8 border-2" disabled>
                  <Smartphone className="mr-2 h-5 w-5" />
                  iOS (Bientôt)
                </Button>
              </div>
              <p className="text-sm text-gray-400">Version 1.0 • Compatible Android 8+ • Poids: 61 MB</p>
            </div>
            <div className="relative hidden lg:block">
              <div className="relative mx-auto w-72">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/20 to-blue-600/10 rounded-[3rem] -rotate-3" />
                <div className="relative bg-gray-900 rounded-[3rem] p-4 shadow-2xl border-4 border-gray-800">
                  <div className="bg-gray-800 rounded-t-2xl p-3 text-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full inline-block mx-1" />
                    <div className="w-2 h-2 bg-yellow-500 rounded-full inline-block mx-1" />
                    <div className="w-2 h-2 bg-green-500 rounded-full inline-block mx-1" />
                  </div>
                  <div className="bg-white rounded-b-2xl p-4 space-y-3 min-h-[400px]">
                    <div className="text-center border-b pb-3">
                      <p className="text-xs text-gray-500">09:41</p>
                      <p className="font-bold text-sm">Mega Supervision</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-xs font-medium">Pharmacie Centrale - 12:30</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <span className="text-xs font-medium">Clinique Saint-Jean - 14:15</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-gray-400 rounded-full" />
                        <span className="text-xs font-medium">Dépôt MedExpress - 16:00</span>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <p className="text-xs text-blue-600 font-medium">VISITE EN COURS</p>
                      <p className="text-sm font-bold">Hôpital Régional</p>
                      <p className="text-xs text-gray-500">Depuis 14:32 • Durée: 23 min</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Directeur Commercial Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-3xl p-8 sm:p-12 lg:p-16 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />
            <div className="relative grid lg:grid-cols-2 gap-8 items-center">
              <div className="text-white space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm font-medium backdrop-blur-sm">
                  <Building2 className="h-4 w-4" /> Espace Directeur Commercial
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold">
                  Pilotez votre équipe depuis votre tableau de bord
                </h2>
                <ul className="space-y-3">
                  {[
                    'Visualisez l\'activité en temps réel',
                    'Analysez les performances par délégué',
                    'Générez des rapports PDF professionnels',
                    'Détectez les anomalies automatiquement',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <ArrowRight className="h-4 w-4 text-blue-200" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 shadow-xl rounded-xl px-8" onClick={() => setShowLogin(true)}>
                  Accéder au Dashboard
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-5 w-5 text-blue-400" />
                <span className="text-white font-bold">Mega Supervision</span>
              </div>
              <p className="text-sm">Solution Smart CRM pour le pilotage des équipes terrain.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Produit</h4>
              <ul className="space-y-2 text-sm">
                <li>Fonctionnalités</li>
                <li>Tarifs</li>
                <li>FAQ</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Support</h4>
              <ul className="space-y-2 text-sm">
                <li>Documentation</li>
                <li>Contact</li>
                <li>Assistance</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Légal</h4>
              <ul className="space-y-2 text-sm">
                <li>Confidentialité</li>
                <li>CGU</li>
                <li>Mentions légales</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
            &copy; 2026 Mega Supervision. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}

'use client';

import { Menu, LogOut, Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Mega Supervision
          </h2>
          <p className="text-xs text-gray-500">Directeur Commercial</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
          <Avatar
            nom={user?.nom || 'U'}
            prenom={user?.prenom || 'U'}
            className="h-8 w-8"
          />
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900">
              {user?.prenom} {user?.nom}
            </p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="text-gray-500 hover:text-red-600"
            title="Déconnexion"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';

interface AvatarProps {
  nom: string;
  prenom: string;
  className?: string;
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ nom, prenom, className }, ref) => {
    const initials = getInitials(nom, prenom);
    return (
      <div
        ref={ref}
        className={cn(
          'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-primary text-primary-foreground items-center justify-center text-sm font-medium',
          className
        )}
      >
        {initials}
      </div>
    );
  }
);
Avatar.displayName = 'Avatar';

export { Avatar };

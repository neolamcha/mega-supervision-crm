import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, fmt: string = 'dd/MM/yyyy') {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt, { locale: fr });
}

export function formatDateTime(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, "dd/MM/yyyy HH:mm", { locale: fr });
}

export function formatRelative(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: fr });
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}min`;
  }
  return `${mins} min`;
}

export function getInitials(nom: string, prenom: string): string {
  return `${nom.charAt(0).toUpperCase()}${prenom.charAt(0).toUpperCase()}`;
}

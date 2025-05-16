import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface DateFormat {
  full: string;
  short: string;
  relative: string;
  time: string;
}

export function formatDate(date?: string | Date | null): DateFormat {
  if (!date) return {
    full: 'N/A',
    short: 'N/A',
    relative: 'N/A',
    time: 'N/A'
  };

  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return {
    full: 'Invalid Date',
    short: 'Invalid Date',
    relative: 'Invalid Date',
    time: 'Invalid Date'
  };

  return {
    full: d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    short: d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }),
    relative: getRelativeTimeString(d),
    time: d.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    })
  };
}

function getRelativeTimeString(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}mo ago`;
  }
  
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}y ago`;
}

export function getInitials(name: string): string {
  // If it's an email, get the part before @
  const cleanName = name.includes('@') ? name.split('@')[0] : name;
  
  // Split by spaces, dots, or underscores
  const parts = cleanName.split(/[\s._-]+/);
  
  if (parts.length === 1) {
    // If single word, take first two characters
    return parts[0].substring(0, 2).toUpperCase();
  }
  
  // Otherwise take first character of first two parts
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
}

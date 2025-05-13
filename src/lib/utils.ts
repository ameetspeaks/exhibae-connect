import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  const d = typeof date === 'string' ? new Date(date) : date
  return {
    full: format(d, 'MMMM d, yyyy'),
    short: format(d, 'MMM d, yyyy'),
    relative: formatDistanceToNow(d, { addSuffix: true }),
    time: format(d, 'h:mm a')
  }
}

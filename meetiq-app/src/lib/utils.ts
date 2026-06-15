import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format, isAfter, differenceInHours, differenceInDays } from 'date-fns';

/**
 * Merge Tailwind CSS classes with clsx for conditional class composition.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date as a relative time string (e.g., "5 minutes ago").
 */
export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

/**
 * Format a date in a standard display format.
 */
export function formatDate(date: string | Date, formatStr = 'MMM d, yyyy'): string {
  return format(new Date(date), formatStr);
}

/**
 * Format a date with day of week (e.g., "Friday, June 13").
 */
export function formatDateLong(date: string | Date): string {
  return format(new Date(date), 'EEEE, MMMM d');
}

/**
 * Check if a commitment is overdue based on its due date.
 */
export function isOverdue(dueDate: string | Date): boolean {
  return isAfter(new Date(), new Date(dueDate));
}

/**
 * Calculate days overdue for a commitment.
 */
export function daysOverdue(dueDate: string | Date): number {
  const diff = differenceInDays(new Date(), new Date(dueDate));
  return diff > 0 ? diff : 0;
}

/**
 * Check if a commitment should be escalated (unconfirmed after 48 hours).
 */
export function shouldEscalate(createdAt: string | Date): boolean {
  return differenceInHours(new Date(), new Date(createdAt)) >= 48;
}

/**
 * Map AI confidence level to display properties.
 */
export function getConfidenceDisplay(confidence: string | null) {
  switch (confidence) {
    case 'high':
      return {
        label: 'High confidence',
        color: 'bg-green-100 text-green-800 border-green-200',
        dotColor: 'bg-green-500',
      };
    case 'medium':
      return {
        label: 'Review suggested',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        dotColor: 'bg-yellow-500',
      };
    case 'low':
      return {
        label: 'Needs review',
        color: 'bg-red-100 text-red-800 border-red-200',
        dotColor: 'bg-red-500',
      };
    default:
      return {
        label: 'Unknown',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        dotColor: 'bg-gray-500',
      };
  }
}

/**
 * Map commitment status to display properties.
 */
export function getStatusDisplay(status: string) {
  switch (status) {
    case 'pending_confirmation':
      return { label: 'Pending Confirmation', color: 'bg-gray-100 text-gray-700 border-gray-200' };
    case 'in_progress':
      return { label: 'In Progress', color: 'bg-blue-100 text-blue-700 border-blue-200/50' };
    case 'blocked':
      return { label: 'Blocked', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
    case 'completed':
      return { label: 'Completed', color: 'bg-green-100 text-green-700 border-green-200' };
    case 'overdue':
      return { label: 'Overdue', color: 'bg-red-100 text-red-700 border-red-200' };
    default:
      return { label: status, color: 'bg-gray-100 text-gray-700 border-gray-200' };
  }
}

/**
 * Map priority to display properties.
 */
export function getPriorityDisplay(priority: string) {
  switch (priority) {
    case 'high':
      return { label: 'High', color: 'bg-red-100 text-red-700' };
    case 'medium':
      return { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' };
    case 'low':
      return { label: 'Low', color: 'bg-green-100 text-green-700' };
    default:
      return { label: priority, color: 'bg-gray-100 text-gray-700' };
  }
}

/**
 * Generate initials from a display name.
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Truncate text to a maximum length with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '…';
}

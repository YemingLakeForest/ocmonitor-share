// Formatting helpers

export function formatCost(cost: number): string {
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  if (cost < 1) return `$${cost.toFixed(3)}`;
  return `$${cost.toFixed(2)}`;
}

export function formatTokens(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toLocaleString();
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function monthName(monthNum: number): string {
  const names = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return names[monthNum] || `M${monthNum}`;
}

// Chart color palette
export const CHART_COLORS = [
  '#6C63FF',
  '#00D4AA',
  '#FFB84D',
  '#FF6B6B',
  '#4ECDC4',
  '#C084FC',
  '#F472B6',
  '#38BDF8',
  '#FB923C',
  '#A3E635',
];

// Tooltip formatter helpers (recharts compatible)
export function costFormatter(value: any): [string, string] {
  return [`$${Number(value).toFixed(2)}`, 'Cost'];
}

export function tokenFormatter(value: any): [string, string] {
  return [formatTokens(Number(value)), 'Tokens'];
}

export function costLabelFormatter(value: any): string {
  return `$${Number(value).toFixed(2)}`;
}

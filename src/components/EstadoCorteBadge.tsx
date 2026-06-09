import type { EstadoCorte } from '@/lib/avance'

const CONFIG: Record<Exclude<EstadoCorte, 'no-aplica'>, { dot: string; text: string; label: string }> = {
  confirmado: { dot: 'bg-green-500', text: 'text-green-700', label: 'Confirmado' },
  pendiente:  { dot: 'bg-amber-500', text: 'text-amber-700', label: 'Pendiente' },
}

export function EstadoCorteBadge({ estado, showLabel = true }: { estado: EstadoCorte; showLabel?: boolean }) {
  if (estado === 'no-aplica') return <span className="text-muted-foreground">—</span>
  const cfg = CONFIG[estado]
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${cfg.text}`}>
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} aria-hidden />
      {showLabel && cfg.label}
    </span>
  )
}

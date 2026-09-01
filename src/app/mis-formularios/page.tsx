'use client'
import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { toast } from 'sonner'
import { ClipboardList } from 'lucide-react'
import { getReportesResumen, eliminarReporte, type ReporteResumen } from '@/lib/reportes'
import { FormularioCard } from '@/components/FormularioCard'
import { CalendarPicker } from '@/components/CalendarPicker'
import { cn } from '@/lib/utils'

type FiltroEstado = 'todos' | 'pendientes' | 'confirmados'

const ESTADOS: { value: FiltroEstado; label: string }[] = [
  { value: 'todos',       label: 'Todos' },
  { value: 'pendientes',  label: 'Pendientes' },
  { value: 'confirmados', label: 'Confirmados' },
]

export default function MisFormulariosPage() {
  const [desde, setDesde] = useState<string | null>(null)
  const [hasta, setHasta] = useState<string | null>(null)
  const [estado, setEstado] = useState<FiltroEstado>('todos')
  const [soloSinSync, setSoloSinSync] = useState(false)

  const resumenes = useLiveQuery<ReporteResumen[] | undefined>(
    () => getReportesResumen({ desde: desde ?? undefined, hasta: hasta ?? undefined }),
    [desde, hasta],
  )

  const handleEliminar = async (id: string) => {
    await eliminarReporte(id)
    toast.success('Informe eliminado')
  }

  const filtrados = (resumenes ?? []).filter(r => {
    if (estado === 'pendientes' && !r.tienePctPendiente) return false
    if (estado === 'confirmados' && r.tienePctPendiente) return false
    if (soloSinSync && r.reporte.sync_status !== 'pending') return false
    return true
  })

  const loading = resumenes === undefined
  const hayFiltros = !!desde || !!hasta || estado !== 'todos' || soloSinSync

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <ClipboardList size={20} className="text-green-700" />
        <h1 className="text-xl font-bold text-green-800">Mis formularios</h1>
      </div>

      {/* Filtros */}
      <div className="space-y-3 border rounded-lg p-3 bg-gray-50/50">
        <div className="flex flex-wrap gap-2">
          {ESTADOS.map(e => (
            <button
              key={e.value}
              type="button"
              onClick={() => setEstado(e.value)}
              className={cn(
                'px-3 py-1 rounded-full text-xs border transition-colors',
                estado === e.value
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
              )}
            >
              {e.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSoloSinSync(v => !v)}
            className={cn(
              'px-3 py-1 rounded-full text-xs border transition-colors',
              soloSinSync
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50',
            )}
          >
            Sin sincronizar
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <CalendarPicker
            label="Desde"
            value={desde}
            onChange={setDesde}
            maxDate={new Date()}
            placeholder="Cualquiera"
          />
          <CalendarPicker
            label="Hasta"
            value={hasta}
            onChange={setHasta}
            maxDate={new Date()}
            minDate={desde ? new Date(desde) : undefined}
            placeholder="Cualquiera"
          />
        </div>

        {hayFiltros && (
          <button
            type="button"
            onClick={() => { setDesde(null); setHasta(null); setEstado('todos'); setSoloSinSync(false) }}
            className="text-xs text-muted-foreground underline hover:text-foreground"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Lista */}
      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-12">Cargando…</p>
      ) : filtrados.length === 0 ? (
        <p className="text-sm text-muted-foreground italic text-center py-12">
          {(resumenes?.length ?? 0) === 0
            ? 'Aún no has guardado informes.'
            : 'Ningún informe coincide con los filtros.'}
        </p>
      ) : (
        <div className="space-y-3">
          {filtrados.map(r => (
            <FormularioCard key={r.reporte.id} resumen={r} onEliminar={handleEliminar} />
          ))}
        </div>
      )}
    </div>
  )
}

'use client'
import Link from 'next/link'
import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Eye, Trash2, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
  AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { useCatalog } from '@/components/CatalogProvider'
import { cn } from '@/lib/utils'
import type { ReporteResumen } from '@/lib/reportes'

export function FormularioCard({
  resumen,
  onEliminar,
}: {
  resumen: ReporteResumen
  onEliminar: (id: string) => void | Promise<void>
}) {
  const { poligonos } = useCatalog()
  const [deleting, setDeleting] = useState(false)
  const { reporte, numActividades, numSubactividades, numCortes, tienePctPendiente } = resumen

  const polig = poligonos.find(p => p.id === reporte.poligono_id)
  const operarios = reporte.operarios_hombre + reporte.operarios_mujer
  const sinSync = reporte.sync_status === 'pending'

  const handleDelete = async () => {
    setDeleting(true)
    try { await onEliminar(reporte.id) } finally { setDeleting(false) }
  }

  return (
    <div
      className={cn(
        'rounded-lg border p-4 space-y-3 bg-white',
        tienePctPendiente && 'border-amber-300 bg-amber-50/40',
      )}
    >
      {/* Fecha + estado */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-foreground first-letter:uppercase truncate">
            {format(parseISO(reporte.fecha), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin size={12} className="flex-shrink-0" />
            <span className="truncate">{polig ? `${polig.codigo} — ${polig.nombre}` : 'Sin polígono'}</span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {sinSync
            ? <Badge variant="destructive">Sin sincronizar</Badge>
            : <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">Sincronizado</Badge>}
          {tienePctPendiente && (
            <Badge variant="outline" className="border-amber-300 bg-amber-100 text-amber-800">% pendiente</Badge>
          )}
        </div>
      </div>

      {/* Info rápida */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <span>{numActividades} actividad{numActividades === 1 ? '' : 'es'}</span>
        <span>·</span>
        <span>{numSubactividades} subactividad{numSubactividades === 1 ? '' : 'es'}</span>
        <span>·</span>
        <span>{operarios} operario{operarios === 1 ? '' : 's'}</span>
        {numCortes > 0 && (
          <>
            <span>·</span>
            <span className="text-red-500">✂ {numCortes} corte{numCortes === 1 ? '' : 's'}</span>
          </>
        )}
      </div>

      {/* Acciones */}
      <div className="flex gap-2 pt-1">
        <Button asChild variant="outline" size="sm" className="flex-1">
          <Link href={`/mis-formularios/${reporte.id}`}>
            <Eye size={14} className="mr-1.5" /> Ver
          </Link>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              aria-label="Eliminar informe"
            >
              <Trash2 size={14} />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar este informe?</AlertDialogTitle>
              <AlertDialogDescription>
                Se eliminará de este dispositivo el informe del{' '}
                {format(parseISO(reporte.fecha), "d 'de' MMMM", { locale: es })} y todo su contenido.
                Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting ? 'Eliminando…' : 'Eliminar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

'use client'
import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useFormStore } from '@/hooks/useFormStore'
import { useCatalog } from '@/components/CatalogProvider'
import { NumericChipSelect } from '@/components/ChipMultiSelect'
import { TimePicker } from '@/components/TimePicker'
import { CalendarPicker } from '@/components/CalendarPicker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronRight } from 'lucide-react'

const schema = z.object({
  profesional:        z.string().min(1, 'Requerido'),
  fecha:              z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  poligono_id:        z.number({ required_error: 'Seleccione un polígono' }),
  numeros_cuadrilla:  z.array(z.number()).min(1, 'Seleccione al menos una cuadrilla'),
  operarios_hombre:   z.coerce.number().int().min(0).max(99),
  operarios_mujer:    z.coerce.number().int().min(0).max(99),
  hora_ingreso:       z.string(),
  hora_salida:        z.string(),
})

type Schema = z.infer<typeof schema>

export default function Hoja1({ onNext }: { onNext: () => void }) {
  const store = useFormStore()
  const { poligonos, isLoading } = useCatalog()

  const { register, control, handleSubmit, setValue, watch, formState: { errors } } = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: {
      profesional:       store.profesional,
      fecha:             store.fecha,
      poligono_id:       store.poligono_id ?? undefined,
      numeros_cuadrilla: store.numeros_cuadrilla,
      operarios_hombre:  store.operarios_hombre,
      operarios_mujer:   store.operarios_mujer,
      hora_ingreso:      store.hora_ingreso,
      hora_salida:       store.hora_salida,
    },
  })

  const cuadrilla = watch('numeros_cuadrilla')
  const horaIngreso = watch('hora_ingreso')
  const horaSalida  = watch('hora_salida')

  // Keep store in sync as user types
  useEffect(() => {
    const sub = watch((vals) => store.patchHoja1(vals as Parameters<typeof store.patchHoja1>[0]))
    return () => sub.unsubscribe()
  }, [watch, store])

  const onSubmit = (data: Schema) => {
    store.patchHoja1(data)
    onNext()
  }

  const errMsg = (e?: { message?: string }) => e?.message
    ? <p className="text-xs text-red-500 mt-1">{e.message}</p>
    : null

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <h2 className="text-lg font-semibold text-green-800">Información General</h2>

      {/* Profesional */}
      <div className="space-y-1.5">
        <Label htmlFor="profesional">Profesional de campo</Label>
        <Input id="profesional" {...register('profesional')} />
        {errMsg(errors.profesional)}
      </div>

      {/* Fecha */}
      <Controller
        name="fecha"
        control={control}
        render={({ field }) => (
          <CalendarPicker
            label="Fecha"
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />
      {errMsg(errors.fecha)}

      {/* Polígono */}
      <div className="space-y-1.5">
        <Label>Código y nombre de polígono</Label>
        {isLoading
          ? <p className="text-sm text-muted-foreground">Cargando polígonos…</p>
          : (
            <Controller
              name="poligono_id"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ? String(field.value) : ''}
                  onValueChange={v => field.onChange(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar polígono…" />
                  </SelectTrigger>
                  <SelectContent>
                    {poligonos.map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        <span className="font-mono text-xs text-green-700 mr-2">{p.codigo}</span>
                        {p.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          )
        }
        {errMsg(errors.poligono_id)}
      </div>

      {/* Cuadrilla */}
      <div className="space-y-1.5">
        <Label>Número de cuadrilla</Label>
        <NumericChipSelect
          selected={cuadrilla ?? []}
          onChange={v => setValue('numeros_cuadrilla', v, { shouldValidate: true })}
          min={1}
          max={20}
        />
        {errMsg(errors.numeros_cuadrilla)}
      </div>

      {/* Operarios */}
      <div className="space-y-1.5">
        <Label>Cantidad de operarios</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Hombres</Label>
            <Input
              type="number"
              min={0}
              max={99}
              {...register('operarios_hombre')}
              className="text-center text-lg font-semibold"
            />
            {errMsg(errors.operarios_hombre)}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Mujeres</Label>
            <Input
              type="number"
              min={0}
              max={99}
              {...register('operarios_mujer')}
              className="text-center text-lg font-semibold"
            />
            {errMsg(errors.operarios_mujer)}
          </div>
        </div>
      </div>

      {/* Horas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TimePicker
          label="Hora de ingreso"
          value={horaIngreso}
          onChange={v => setValue('hora_ingreso', v)}
        />
        <TimePicker
          label="Hora de salida"
          value={horaSalida}
          onChange={v => setValue('hora_salida', v)}
        />
      </div>

      <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
        Siguiente <ChevronRight size={16} className="ml-1" />
      </Button>
    </form>
  )
}

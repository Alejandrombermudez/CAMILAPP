'use client'
import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import 'react-day-picker/style.css'

interface CalendarPickerProps {
  value: string | null        // 'YYYY-MM-DD'
  onChange: (value: string) => void
  label?: string
  maxDate?: Date
  minDate?: Date
  placeholder?: string
  className?: string
}

export function CalendarPicker({
  value,
  onChange,
  label,
  maxDate,
  minDate,
  placeholder = 'Seleccionar fecha',
  className,
}: CalendarPickerProps) {
  const [open, setOpen] = useState(false)

  const selected = value ? parseISO(value) : undefined

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && <Label>{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            type="button"
            className={cn(
              'w-full justify-start text-left font-normal',
              !selected && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selected
              ? format(selected, 'dd MMMM yyyy', { locale: es })
              : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={(day) => {
              if (day) {
                onChange(format(day, 'yyyy-MM-dd'))
                setOpen(false)
              }
            }}
            disabled={[
              ...(maxDate ? [{ after: maxDate }] : []),
              ...(minDate ? [{ before: minDate }] : []),
            ]}
            locale={es}
            defaultMonth={selected}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

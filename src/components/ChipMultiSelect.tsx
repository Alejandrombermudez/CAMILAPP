'use client'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { X, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Option {
  value: string
  label: string
}

interface ChipMultiSelectProps {
  options: Option[]
  selected: string[]
  onChange: (selected: string[]) => void
  includeOtra?: boolean
  otraLabel?: string
  otraInputPlaceholder?: string
  otraValue?: string
  onOtraValueChange?: (v: string) => void
  placeholder?: string
  className?: string
  isNumeric?: boolean
  maxNumeric?: number
  disabled?: boolean
}

export function ChipMultiSelect({
  options,
  selected,
  onChange,
  includeOtra = false,
  otraLabel = 'Otra',
  otraInputPlaceholder = 'Escribe aquí...',
  otraValue = '',
  onOtraValueChange,
  className,
  disabled = false,
}: ChipMultiSelectProps) {
  const [pendingOtra, setPendingOtra] = useState('')

  const hasOtra = selected.includes('__OTRA__')
  const available = options.filter(o => !selected.includes(o.value))

  const add = (value: string) => {
    if (!selected.includes(value)) onChange([...selected, value])
  }

  const remove = (value: string) => {
    onChange(selected.filter(s => s !== value))
    if (value === '__OTRA__' && onOtraValueChange) onOtraValueChange('')
  }

  const handleAddOtra = () => {
    if (!hasOtra) {
      onChange([...selected, '__OTRA__'])
    }
  }

  const labelFor = (val: string) => {
    if (val === '__OTRA__') return otraValue || otraLabel
    return options.find(o => o.value === val)?.label ?? val
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Selected chips */}
      <div className="flex flex-wrap gap-2 min-h-[2rem]">
        {selected.map(val => (
          <Badge
            key={val}
            variant="success"
            className="gap-1 pr-1 animate-in fade-in-0 zoom-in-95 duration-150"
          >
            <span className="max-w-[180px] truncate">{labelFor(val)}</span>
            {!disabled && (
              <button
                type="button"
                onClick={() => remove(val)}
                className="ml-1 rounded-full hover:bg-green-800 p-0.5 flex-shrink-0"
                aria-label={`Quitar ${labelFor(val)}`}
              >
                <X size={10} />
              </button>
            )}
          </Badge>
        ))}
      </div>

      {/* Otra custom input */}
      {hasOtra && onOtraValueChange && (
        <Input
          placeholder={otraInputPlaceholder}
          value={otraValue}
          onChange={e => onOtraValueChange(e.target.value)}
          className="max-w-xs text-sm"
          disabled={disabled}
        />
      )}

      {/* Available options + Otra button */}
      {!disabled && (
        <div className="flex flex-wrap gap-1.5">
          {available.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => add(opt.value)}
              className="px-2.5 py-1 rounded-full border border-green-300 text-xs hover:bg-green-50 hover:border-green-500 transition-colors text-left"
            >
              {opt.label}
            </button>
          ))}
          {includeOtra && !hasOtra && (
            <button
              type="button"
              onClick={handleAddOtra}
              className="px-2.5 py-1 rounded-full border border-dashed border-gray-400 text-xs hover:bg-gray-50 transition-colors flex items-center gap-1"
            >
              <Plus size={10} /> {otraLabel}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// Numeric version for crew numbers (1–20)
interface NumericChipSelectProps {
  selected: number[]
  onChange: (selected: number[]) => void
  min?: number
  max?: number
}

export function NumericChipSelect({ selected, onChange, min = 1, max = 20 }: NumericChipSelectProps) {
  const all = Array.from({ length: max - min + 1 }, (_, i) => i + min)
  const available = all.filter(n => !selected.includes(n))

  const add = (n: number) => onChange([...selected, n].sort((a, b) => a - b))
  const remove = (n: number) => onChange(selected.filter(s => s !== n))

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 min-h-[2rem]">
        {selected.map(n => (
          <Badge key={n} variant="success" className="gap-1 pr-1 animate-in fade-in-0 zoom-in-95 duration-150">
            Cuadrilla {n}
            <button
              type="button"
              onClick={() => remove(n)}
              className="ml-1 rounded-full hover:bg-green-800 p-0.5"
              aria-label={`Quitar cuadrilla ${n}`}
            >
              <X size={10} />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {available.map(n => (
          <button
            key={n}
            type="button"
            onClick={() => add(n)}
            className="w-9 h-9 rounded-full border border-green-300 text-xs font-medium hover:bg-green-50 hover:border-green-500 transition-colors"
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

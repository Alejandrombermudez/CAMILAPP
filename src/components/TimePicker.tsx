'use client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

interface TimePickerProps {
  value: string      // 'HH:mm' 24h format
  onChange: (value: string) => void
  label?: string
}

const HOURS   = Array.from({ length: 12 }, (_, i) => i + 1)
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

export function TimePicker({ value, onChange, label }: TimePickerProps) {
  const [hStr, mStr] = value.split(':')
  const hour24 = parseInt(hStr ?? '6', 10)
  const minute  = parseInt(mStr ?? '0', 10)
  const isPM    = hour24 >= 12
  const hour12  = hour24 % 12 === 0 ? 12 : hour24 % 12

  const emit = (h12: number, m: number, pm: boolean) => {
    let h24 = h12 % 12
    if (pm) h24 += 12
    onChange(`${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }

  return (
    <div className="space-y-1.5">
      {label && <Label>{label}</Label>}
      <div className="flex items-center gap-2">
        <Select value={String(hour12)} onValueChange={v => emit(parseInt(v), minute, isPM)}>
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HOURS.map(h => (
              <SelectItem key={h} value={String(h)}>
                {String(h).padStart(2, '0')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-lg font-bold text-muted-foreground">:</span>

        <Select value={String(minute)} onValueChange={v => emit(hour12, parseInt(v), isPM)}>
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MINUTES.map(m => (
              <SelectItem key={m} value={String(m)}>
                {String(m).padStart(2, '0')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={isPM ? 'PM' : 'AM'} onValueChange={v => emit(hour12, minute, v === 'PM')}>
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AM">AM</SelectItem>
            <SelectItem value="PM">PM</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

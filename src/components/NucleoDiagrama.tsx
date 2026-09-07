'use client'
import { tipoColor } from '@/lib/designs-data'
import type { EspecieDiseno } from '@/lib/designs-data'

// Diagrama del arreglo de nucleación: nodos numerados (1..N, según la lista de
// especies) dispuestos en anillo; para el núcleo de 7 sp, uno al centro y 6 alrededor.
export function NucleoDiagrama({
  especies, tipo, kind,
}: {
  especies: EspecieDiseno[]
  tipo: number
  kind: string
}) {
  const N = especies.length
  if (N === 0) return null
  const color = tipoColor(tipo)
  const cx = 130, cy = 130, R = 92, nodeR = 16

  const hasCenter = kind === 'nucleo_7sp' && N === 7
  const centerIdx = hasCenter ? 0 : -1
  const ringIdx: number[] = especies.map((_, i) => i).filter(i => i !== centerIdx)
  const M = ringIdx.length

  const nodes = especies.map((_, i) => {
    if (i === centerIdx) return { i, x: cx, y: cy, n: i + 1 }
    const k = ringIdx.indexOf(i)
    const ang = ((-90 + (360 / M) * k) * Math.PI) / 180
    return { i, x: cx + R * Math.cos(ang), y: cy + R * Math.sin(ang), n: i + 1 }
  })
  const ringNodes = nodes.filter(nd => nd.i !== centerIdx)

  return (
    <svg viewBox="0 0 260 260" className="w-full max-w-[220px] mx-auto" role="img" aria-label="Diagrama del núcleo">
      {hasCenter
        ? ringNodes.map(nd => (
            <line key={`l${nd.i}`} x1={cx} y1={cy} x2={nd.x} y2={nd.y} stroke="#cbd5e1" strokeWidth={1.5} />
          ))
        : ringNodes.map((nd, k) => {
            const nx = ringNodes[(k + 1) % ringNodes.length]
            return <line key={`l${nd.i}`} x1={nd.x} y1={nd.y} x2={nx.x} y2={nx.y} stroke="#cbd5e1" strokeWidth={1.5} />
          })}
      {nodes.map(nd => (
        <g key={nd.i}>
          <circle cx={nd.x} cy={nd.y} r={nodeR} fill={color} stroke="#ffffff" strokeWidth={2} />
          <text x={nd.x} y={nd.y + 4} textAnchor="middle" fontSize={13} fontWeight={700} fill="#ffffff">{nd.n}</text>
        </g>
      ))}
    </svg>
  )
}

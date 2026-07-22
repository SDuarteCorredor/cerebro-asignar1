import Link from 'next/link'
import { crearClienteServidor } from '@/lib/supabase/server'
import Icono from '@/components/app/Icono'

interface Props { usuarioId: string }

/** Ícono y color por tipo — mismo mapa que Campana.tsx (evita import cliente). */
const estiloPorTipo: Record<string, { icono: string; color: string }> = {
  ausencia_pendiente: { icono: 'inbox', color: 'var(--warning-ink)' },
  ausencia_aprobada: { icono: 'check', color: 'var(--success-ink)' },
  ausencia_denegada: { icono: 'x', color: 'var(--danger-ink)' },
  ausencia_segunda_validacion: { icono: 'shield', color: 'var(--warning-ink)' },
  documento_por_aprobar: { icono: 'inbox', color: 'var(--primary)' },
  documento_aprobado: { icono: 'check', color: 'var(--success-ink)' },
  documento_rechazado: { icono: 'x', color: 'var(--danger-ink)' },
}

function hace(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 1) return 'ahora'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.floor(h / 24)
  if (d < 30) return `hace ${d} d`
  return new Date(iso).toLocaleDateString('es-CO')
}

export default async function UltimasNotificaciones({ usuarioId: _usuarioId }: Props) {
  const supabase = await crearClienteServidor()
  // RLS restringe a las propias
  const { data } = await supabase
    .from('notificaciones')
    .select('id, tipo, titulo, mensaje, url, leida, created_at')
    .eq('leida', false)
    .order('created_at', { ascending: false })
    .limit(5)

  const items = data ?? []
  if (items.length === 0) return null

  return (
    <section className="dash-section">
      <div className="section-header">
        <h2 className="section-title">Sin leer</h2>
        <span className="section-count text-sm">{items.length}</span>
      </div>
      <div className="card dash-notis">
        {items.map(n => {
          const est = estiloPorTipo[n.tipo] ?? { icono: 'info', color: 'var(--text-3)' }
          const Elem = n.url ? Link : 'div'
          const props = n.url ? { href: n.url as string } : {}
          return (
            <Elem key={n.id} className="dash-notis__item" {...(props as { href: string })}>
              <Icono nombre={est.icono} className="icon icon--sm" style={{ color: est.color, flexShrink: 0, marginTop: 2 }} />
              <div className="dash-notis__cuerpo">
                <div className="dash-notis__titulo">{n.titulo}</div>
                {n.mensaje && <div className="dash-notis__msg">{n.mensaje}</div>}
                <div className="dash-notis__fecha">{hace(n.created_at)}</div>
              </div>
            </Elem>
          )
        })}
      </div>
    </section>
  )
}

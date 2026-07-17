'use client'

import { useState } from 'react'
import Icono from '@/components/app/Icono'

interface EntradaHistorial {
  id: string
  version_anterior: string
  version_nueva: string
  fecha_cambio: string
  resumen_cambio: string
  usuario: { nombre: string } | null
}

export default function PanelHistorial({ historial }: { historial: EntradaHistorial[] }) {
  const [abierto, setAbierto] = useState(false)

  return (
    <>
      <button className="btn btn--secondary btn--sm" onClick={() => setAbierto(true)}>
        <Icono nombre="history" className="icon icon--sm" /> Historial de versiones
      </button>

      {abierto && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 80, display: 'flex', justifyContent: 'flex-end' }}>
          <div
            onClick={() => setAbierto(false)}
            style={{ position: 'absolute', inset: 0, background: 'var(--overlay)' }}
          />
          <div className="fade-up" style={{
            position: 'relative',
            width: 460,
            background: 'var(--surface)',
            boxShadow: 'var(--shadow-lg)',
            height: '100vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--divider)' }}>
              <div>
                <div className="page__eyebrow" style={{ margin: 0 }}>Historial</div>
                <h3 style={{ margin: '2px 0 0', fontSize: 17, fontWeight: 700 }}>Versiones del proceso</h3>
              </div>
              <button className="btn btn--ghost btn--sm" onClick={() => setAbierto(false)}>
                <Icono nombre="x" className="icon" />
              </button>
            </div>

            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {historial.length > 0 ? historial.map((h) => (
                <div key={h.id} style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: 14 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: 13 }}>v{h.version_nueva}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                      {new Date(h.fecha_cambio).toLocaleDateString('es-CO')}
                    </div>
                  </div>
                  <div style={{ borderLeft: '2px solid var(--border)', paddingLeft: 14 }}>
                    <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5 }}>{h.resumen_cambio}</p>
                    <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-3)' }}>
                      por {h.usuario?.nombre ?? 'Sistema'}
                      {h.version_anterior !== h.version_nueva && (
                        <span style={{ fontFamily: 'var(--font-mono)', marginLeft: 8, color: 'var(--text-muted)' }}>
                          v{h.version_anterior} → v{h.version_nueva}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )) : (
                <div style={{ color: 'var(--text-3)', fontSize: 13 }}>Sin historial registrado.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

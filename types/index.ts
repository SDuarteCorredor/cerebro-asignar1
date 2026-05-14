export type Rol = 'colaborador' | 'lider' | 'admin'

export type EstadoProceso = 'activo' | 'borrador' | 'desactualizado' | 'en_revision'

export interface Usuario {
  id: string
  nombre: string
  correo: string
  rol: Rol
  gestion_id: string | null
  activo: boolean
  created_at: string
}

export interface Gestion {
  id: string
  nombre: string
  descripcion: string
  icono: string
  color_soft: string
  color_primary: string
  lider_id: string | null
  activa: boolean
  created_at: string
  lider?: Usuario
  total_procesos?: number
  procesos_activos?: number
}

export interface Paso {
  id: string
  proceso_id: string
  numero_orden: number
  descripcion: string
  cargo_responsable: string
}

export interface Documento {
  id: string
  proceso_id: string
  nombre: string
  tipo_archivo: string
  url_descarga: string
  tamano_bytes: number | null
  created_at: string
}

export interface HistorialVersion {
  id: string
  proceso_id: string
  version_anterior: string
  version_nueva: string
  fecha_cambio: string
  usuario_id: string
  resumen_cambio: string
  usuario?: Usuario
}

export interface Proceso {
  id: string
  nombre: string
  gestion_id: string
  objetivo: string
  version: string
  fecha_actualizacion: string
  estado: EstadoProceso
  creado_por: string | null
  aprobado_por: string | null
  comentario_rechazo: string | null
  created_at: string
  gestion?: Gestion
  pasos?: Paso[]
  documentos?: Documento[]
  historial?: HistorialVersion[]
}

export interface SesionUsuario {
  id: string
  nombre: string
  correo: string
  rol: Rol
  gestion_id: string | null
  iniciales: string
}

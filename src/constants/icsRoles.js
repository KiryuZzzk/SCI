export const ICS_ROLES = {
  IC:  { code: 'IC',  label: 'Comandante de Incidente', short: 'IC',  level: 1 },
  SO:  { code: 'SO',  label: 'Oficial de Seguridad',    short: 'SO',  level: 2 },
  PIO: { code: 'PIO', label: 'Oficial de Información',  short: 'PIO', level: 2 },
  LO:  { code: 'LO',  label: 'Oficial de Enlace',       short: 'LO',  level: 2 },
  OSC: { code: 'OSC', label: 'Jefe de Operaciones',     short: 'OSC', level: 3 },
  PSC: { code: 'PSC', label: 'Jefe de Planeación',      short: 'PSC', level: 3 },
  LSC: { code: 'LSC', label: 'Jefe de Logística',       short: 'LSC', level: 3 },
  FSC: { code: 'FSC', label: 'Jefe de Finanzas/Admin',  short: 'FSC', level: 3 },
}

export const ICS_ROLE_KEYS = Object.keys(ICS_ROLES)

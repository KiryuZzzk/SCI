/**
 * Generador determinístico de tripulación realista por unidad.
 * Mismo resourceId → mismos nombres asignados (estable entre renders).
 *
 * No usa Math.random — usa hash del resourceId como seed para selección
 * de nombres del pool. Crew completo de una unidad puede mostrar nombre
 * por puesto siguiendo el template UNIT_TEMPLATES.
 */

// Pool ampliado de nombres mexicanos plausibles (~80)
const FIRST_NAMES = [
  'Adrián', 'Alejandro', 'Ana', 'Andrés', 'Antonio', 'Beatriz', 'Brenda',
  'Carlos', 'Carmen', 'Cecilia', 'César', 'Claudia', 'Cristina', 'Daniel',
  'Diana', 'Diego', 'Eduardo', 'Elena', 'Enrique', 'Erika', 'Fabián',
  'Felipe', 'Fernando', 'Francisco', 'Gabriela', 'Gerardo', 'Guadalupe',
  'Gustavo', 'Héctor', 'Hugo', 'Ignacio', 'Isabel', 'Iván', 'Javier',
  'Jesús', 'Jorge', 'José', 'Juan', 'Julia', 'Karen', 'Laura', 'Leonardo',
  'Leticia', 'Lorena', 'Luis', 'Luisa', 'Manuel', 'Marco', 'María', 'Mario',
  'Marisol', 'Martha', 'Mauricio', 'Miguel', 'Mónica', 'Nadia', 'Octavio',
  'Óscar', 'Pablo', 'Patricia', 'Pedro', 'Rafael', 'Ramón', 'Raúl',
  'Ricardo', 'Roberto', 'Rocío', 'Rodolfo', 'Rodrigo', 'Rosa', 'Salvador',
  'Sandra', 'Santiago', 'Sergio', 'Silvia', 'Sofía', 'Tomás', 'Verónica',
  'Víctor', 'Yolanda',
]

const LAST_NAMES = [
  'Aguilar', 'Álvarez', 'Aranda', 'Aviña', 'Bautista', 'Beltrán', 'Cabrera',
  'Camacho', 'Cano', 'Cárdenas', 'Castañeda', 'Castillo', 'Castro', 'Cervantes',
  'Chávez', 'Contreras', 'Córdoba', 'Cruz', 'Delgado', 'Domínguez', 'Durán',
  'Escobar', 'Espinoza', 'Esquivel', 'Estrada', 'Fernández', 'Flores',
  'Franco', 'Fuentes', 'Galindo', 'Gallegos', 'García', 'Garza', 'Gómez',
  'González', 'Guerrero', 'Gutiérrez', 'Guzmán', 'Hernández', 'Herrera',
  'Hidalgo', 'Jiménez', 'Juárez', 'Lara', 'Linares', 'López', 'Lozano',
  'Luna', 'Macías', 'Maldonado', 'Martínez', 'Medina', 'Mejía', 'Méndez',
  'Mendoza', 'Mercado', 'Molina', 'Montes', 'Mora', 'Morales', 'Moreno',
  'Muñoz', 'Navarro', 'Núñez', 'Ochoa', 'Olvera', 'Ortega', 'Ortiz',
  'Pacheco', 'Padilla', 'Palacios', 'Pérez', 'Quintero', 'Ramírez', 'Ramos',
  'Reyes', 'Rivera', 'Rodríguez', 'Rojas', 'Romero', 'Ruiz', 'Salazar',
  'Salinas', 'Sánchez', 'Sandoval', 'Serrano', 'Silva', 'Solís', 'Soto',
  'Suárez', 'Tapia', 'Tejada', 'Torres', 'Valdés', 'Valencia', 'Vargas',
  'Vázquez', 'Vega', 'Velázquez', 'Vidal', 'Villanueva', 'Zamora', 'Zavala',
]

// Hash determinístico simple (djb2-like) → entero positivo
function hashStr(s) {
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

// Edad realista por rango
const AGE_RANGES = {
  'TUM-B':       [22, 38],
  'TUM-A':       [26, 42],
  'Médico':      [30, 55],
  'Dr':          [30, 60],
  'Cirujano':    [35, 60],
  'Anestesista': [32, 58],
  'Enf':         [24, 50],
  'Enfermería':  [24, 50],
  'Bombero':     [24, 48],
  'Capitán':     [35, 55],
  'Teniente':    [28, 45],
  'Sargento':    [25, 45],
  'Coordinador': [35, 55],
  'Comandante':  [40, 58],
  'Mayor':       [38, 55],
  'Policía':     [22, 45],
  'Suboficial':  [28, 50],
  'Oficial guía':[28, 50],
  'Rescatista':  [25, 45],
  'Soldados':    [19, 35],
  'Marinos':     [19, 35],
  'Operador':    [25, 50],
  'Ing. Civil':  [30, 55],
  'Coord. PC':   [30, 55],
  'Piloto':      [32, 55],
  'Co-piloto':   [28, 48],
  'Director':    [40, 65],
  'Médicos':     [30, 55],
  'K9':          null,   // perro
}

function pickAge(rango, seed) {
  // Match prefijo conocido
  const key = Object.keys(AGE_RANGES).find(k => rango.startsWith(k))
  if (!key) return null
  const range = AGE_RANGES[key]
  if (!range) return null
  const [min, max] = range
  return min + (seed % (max - min + 1))
}

// Años de servicio plausibles (1-25)
function pickService(seed) {
  return 1 + (seed % 24)
}

/**
 * Genera array de personal con nombre real para un recurso dado.
 * @param {string} resourceId
 * @param {Array<{rango:string, rol:string}>} personalTemplate
 * @returns {Array<{rango:string, rol:string, nombre:string|null, edad:number|null, servicio:number|null}>}
 */
export function generateCrew(resourceId, personalTemplate) {
  if (!resourceId || !Array.isArray(personalTemplate)) return []
  const baseSeed = hashStr(String(resourceId))

  return personalTemplate.map((p, i) => {
    // K9 no tiene nombre humano — usa apodo canino
    if (p.rango === 'K9') {
      const k9Names = ['Rex', 'Thor', 'Lobo', 'Zeus', 'Mando', 'Argos', 'Hércules', 'Bruno', 'Atila', 'Max']
      const seed = baseSeed + i * 7919
      return {
        ...p,
        nombre: k9Names[seed % k9Names.length],
        edad: 2 + (seed % 7), // 2-8 años
        servicio: 1 + (seed % 5),
      }
    }

    // Soldados/Marinos (xN) → identificador genérico
    if (/\(\d+\)|\(x\d+\)/i.test(p.rango)) {
      return { ...p, nombre: '— Personal de unidad —', edad: null, servicio: null }
    }

    const seed = baseSeed + i * 7919
    const firstIdx = seed % FIRST_NAMES.length
    const last1Idx = (seed >> 5) % LAST_NAMES.length
    const last2Idx = (seed >> 11) % LAST_NAMES.length
    const nombre = `${FIRST_NAMES[firstIdx]} ${LAST_NAMES[last1Idx]} ${LAST_NAMES[last2Idx]}`
    return {
      ...p,
      nombre,
      edad: pickAge(p.rango, seed),
      servicio: pickService(seed >> 17),
    }
  })
}

/**
 * Estado de equipo por unidad — determinístico, simula desgaste.
 * @returns {Array<{nombre, estado: 'operativo'|'mantenimiento'|'desgaste'}>}
 */
export function generateEquipoStatus(resourceId, equipoTemplate) {
  if (!resourceId || !Array.isArray(equipoTemplate)) return []
  const baseSeed = hashStr(String(resourceId) + '_eq')
  return equipoTemplate.map((nombre, i) => {
    const seed = baseSeed + i * 5381
    const roll = seed % 100
    let estado = 'operativo'
    if (roll < 5) estado = 'mantenimiento'
    else if (roll < 15) estado = 'desgaste'
    return { nombre, estado }
  })
}

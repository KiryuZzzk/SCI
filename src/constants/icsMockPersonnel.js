// Personal mock — ~20 perfiles plausibles para simulación
export const MOCK_PERSONNEL = [
  { id: 'p01', name: 'Cmte. Rodrigo González Martínez', rank: 'Comandante',  org: 'PC-CDMX'    },
  { id: 'p02', name: 'Tte. María Fernanda Cruz Lara',   rank: 'Teniente',    org: 'ERUM'        },
  { id: 'p03', name: 'Ing. Carlos Espinoza Reyes',      rank: 'Ingeniero',   org: 'PC-CDMX'    },
  { id: 'p04', name: 'Cap. Alejandro Ruiz Vega',        rank: 'Capitán',     org: 'BOMBEROS'    },
  { id: 'p05', name: 'Dra. Sofía Morales Hernández',    rank: 'Doctora',     org: 'ERUM'        },
  { id: 'p06', name: 'Sub. Jorge Ramírez Peña',         rank: 'Subteniente', org: 'SSC'         },
  { id: 'p07', name: 'Gral. Brig. Luis Torres Aranda',  rank: 'General Brig.','org': 'SEDENA'   },
  { id: 'p08', name: 'Tte. Cor. Ana Beatriz Salinas',   rank: 'Tte. Coronel','org': 'SEDENA'   },
  { id: 'p09', name: 'Cap. Nav. Roberto Mendoza Díaz',  rank: 'Capitán Nav.', org: 'MARINA'     },
  { id: 'p10', name: 'Lic. Patricia Vargas Soto',       rank: 'Lic.',        org: 'PC-CDMX'    },
  { id: 'p11', name: 'Cmte. Hugo Jiménez Flores',       rank: 'Comandante',  org: 'BOMBEROS'    },
  { id: 'p12', name: 'Enf. Isabel Castillo Rivera',     rank: 'Enfermera',   org: 'CRUZROJA'    },
  { id: 'p13', name: 'Ing. Marco Gutiérrez López',      rank: 'Ingeniero',   org: 'SEDENA'      },
  { id: 'p14', name: 'Sub. Claudia Rojas Medina',       rank: 'Subinspectora','org': 'SSC'      },
  { id: 'p15', name: 'Cap. Enrique Villanueva Cruz',    rank: 'Capitán',     org: 'ERUM'        },
  { id: 'p16', name: 'Lic. Diana Guerrero Pacheco',     rank: 'Lic.',        org: 'PC-CDMX'    },
  { id: 'p17', name: 'Cmte. Felipe Serrano Garza',      rank: 'Comandante',  org: 'BOMBEROS'    },
  { id: 'p18', name: 'Dr. Ramón Delgado Fuentes',       rank: 'Doctor',      org: 'CRUZROJA'    },
  { id: 'p19', name: 'Ten. Sandra Núñez Reyes',         rank: 'Teniente',    org: 'SSC'         },
  { id: 'p20', name: 'Ing. Víctor Sánchez Olvera',      rank: 'Ingeniero',   org: 'PC-CDMX'    },
]

export const personnelById = Object.fromEntries(MOCK_PERSONNEL.map(p => [p.id, p]))

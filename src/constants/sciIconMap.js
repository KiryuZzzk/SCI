/**
 * Mapeo de claves SCI → componente Lucide
 * Importar SciIcon en lugar de usar emojis directamente.
 */
import {
  Ambulance, ShieldAlert, Shield, Flame, Cross, Sword, Anchor,
  Building2, Radio, Stethoscope, TrafficCone, Zap, Droplets, Fuel,
  // Incident types
  Activity, House, Car, Biohazard, Waves, Bomb, FlaskConical,
  Bell, CloudRain, ZapOff, CircleDot, Megaphone,
  // Zone types
  MapPin, TriangleAlert, Tent, Helicopter, Package,
  // Misc
  HeartPulse, HardHat,
} from 'lucide-react'

/** Dependencias SCI → icono Lucide */
export const DEP_ICON = {
  ERUM:     Ambulance,
  SSC:      ShieldAlert,
  PC:       Shield,
  BOMBEROS: Flame,
  CRUZROJA: Cross,
  SEDENA:   Sword,
  MARINA:   Anchor,
  HOSPITAL: Building2,
  C5:       Radio,
  CRUM:     Stethoscope,
  SEMOVI:   TrafficCone,
  CFE:      Zap,
  SACMEX:   Droplets,
  PEMEX:    Fuel,
}

/** Tipos de incidente → icono Lucide */
export const INCIDENT_ICON = {
  sismo:           Activity,
  colapso:         House,
  incendio:        Flame,
  vial:            Car,
  hazmat:          Biohazard,
  inundacion:      Waves,
  explosion:       Bomb,
  fugaQuimica:     FlaskConical,
  seguridad:       Bell,
  tsunami:         Waves,
  fallaElectrica:  ZapOff,
  hundimiento:     CircleDot,
  inundacionPluvial: CloudRain,
  disturbio:       Megaphone,
}

/** Tipos de zona SCI → icono Lucide */
export const ZONE_ICON = {
  acv:       MapPin,
  pc:        Shield,
  triage:    HeartPulse,
  staging:   Package,
  helipuerto: Helicopter,
}

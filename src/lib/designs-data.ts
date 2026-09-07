// Auto-generado desde la ficha de plantación (El Arrayán 2 / RESF0325). NO EDITAR A MANO.
// Diseños florísticos: escenarios × tipos de núcleo × especies.

export interface EspecieDiseno {
  fase: string
  gremio: string
  cientifico: string
  comun: string
  cantidad: number
}
export interface ModuloDiseno {
  tipo: number
  kind: string
  titulo: string
  especies: EspecieDiseno[]
}
export interface EscenarioDiseno {
  clave: string
  nombre: string
  descripcion: string
  modulos: ModuloDiseno[]
}

export const ESCENARIOS: EscenarioDiseno[] = [
  {
    clave: 'plantacion_forestal',
    nombre: 'Plantación forestal',
    descripcion: 'Plantaciones forestales de especies exóticas, principalmente Ciprés (Hesperocyparis lusitanica)',
    modulos: [
      {
        tipo: 1, kind: 'nucleo_5sp', titulo: 'Núcleo sencillo 5 sp (tipo 1)',
        especies: [
          { fase: 'Tardiseral', gremio: 'Semiheliofita', cientifico: 'Myrsine dependens', comun: 'Maíz tostado', cantidad: 275 },
          { fase: 'Mesoseral', gremio: 'Umbrofila', cientifico: 'Duranta mutisii', comun: 'Espino Garbanzo', cantidad: 275 },
          { fase: 'Mesoseral', gremio: 'Umbrofila', cientifico: 'Myrcianthes leucoxyla', comun: 'Arrayan', cantidad: 275 },
          { fase: 'Priseral', gremio: 'Semiheliofita', cientifico: 'Abatia parviflora', comun: 'Duraznillo', cantidad: 275 },
          { fase: 'Priseral', gremio: 'Semiheliofita', cientifico: 'Citharexylum subfavescens', comun: 'Cajeto', cantidad: 275 },
        ],
      },
      {
        tipo: 2, kind: 'nucleo_7sp', titulo: 'Núcleo sencillo 7 sp (tipo 2)',
        especies: [
          { fase: 'Tardiseral', gremio: 'Umbrofila', cientifico: 'Drimys granadensis', comun: 'Canelo de páramo', cantidad: 275 },
          { fase: 'Mesoseral', gremio: 'Semiheliofita', cientifico: 'Escallonia myrtilloides', comun: 'Rodamonte', cantidad: 275 },
          { fase: 'Mesoseral', gremio: 'Semiheliofita', cientifico: 'Miconia squamulosa', comun: 'Tuno Esmeraldo', cantidad: 275 },
          { fase: 'Priseral', gremio: 'Semiheliofita', cientifico: 'Piper bogotense', comun: 'Cordoncillo', cantidad: 275 },
          { fase: 'Priseral', gremio: 'Semiheliofita', cientifico: 'Cestrum buxifolium', comun: 'Tinto', cantidad: 275 },
          { fase: 'Priseral', gremio: 'Semiheliofita', cientifico: 'Vallea stipularis', comun: 'Raque', cantidad: 275 },
          { fase: 'Priseral', gremio: 'Semiheliofita', cientifico: 'Citharexylum subfavescens', comun: 'Cajeto', cantidad: 275 },
        ],
      },
    ],
  },
  {
    clave: 'parches_chusque',
    nombre: 'Parches de chusque',
    descripcion: 'Parches de chusque (Chusquea scandens)',
    modulos: [
      {
        tipo: 1, kind: 'nucleo_5sp', titulo: 'Núcleo sencillo 5 sp (tipo 1)',
        especies: [
          { fase: 'Tardiseral', gremio: 'Semiheliofita', cientifico: 'Myrsine dependens', comun: 'Maíz tostado', cantidad: 325 },
          { fase: 'Mesoseral', gremio: 'Umbrofila', cientifico: 'Duranta mutisii', comun: 'Espino Garbanzo', cantidad: 325 },
          { fase: 'Mesoseral', gremio: 'Umbrofila', cientifico: 'Myrcianthes leucoxyla', comun: 'Arrayan', cantidad: 325 },
          { fase: 'Priseral', gremio: 'Semiheliofita', cientifico: 'Abatia parviflora', comun: 'Duraznillo', cantidad: 325 },
          { fase: 'Priseral', gremio: 'Semiheliofita', cientifico: 'Citharexylum subfavescens', comun: 'Cajeto', cantidad: 325 },
        ],
      },
      {
        tipo: 2, kind: 'nucleo_7sp', titulo: 'Núcleo sencillo 7 sp (tipo 2)',
        especies: [
          { fase: 'Tardiseral', gremio: 'Semiheliofita - Heliofita', cientifico: 'Cedrela montana', comun: 'Cedro', cantidad: 325 },
          { fase: 'Mesoseral', gremio: 'Semiheliofita', cientifico: 'Viburnum triphyllum', comun: 'Garrocho', cantidad: 325 },
          { fase: 'Mesoseral', gremio: 'Heliofita', cientifico: 'Morella pubescens', comun: 'Laurel de cera', cantidad: 325 },
          { fase: 'Priseral', gremio: 'Heliofita', cientifico: 'Ageratina tinifolia', comun: 'Amargoso', cantidad: 325 },
          { fase: 'Priseral', gremio: 'Heliofita', cientifico: 'Monochaetum myrtoideum', comun: 'Angelito', cantidad: 325 },
          { fase: 'Priseral', gremio: 'Heliofita', cientifico: 'Verbesina crassiramea', comun: 'Verbesina', cantidad: 325 },
          { fase: 'Priseral', gremio: 'Heliofita', cientifico: 'Berberis goudotii', comun: 'Uña de Gato', cantidad: 325 },
        ],
      },
      {
        tipo: 3, kind: 'triada', titulo: 'Triada (tipo 3)',
        especies: [
          { fase: 'Tardiseral', gremio: 'Semiheliofita', cientifico: 'Myrsine guianensis', comun: 'Cucharo Punta de Lanza', cantidad: 300 },
          { fase: 'Mesoseral', gremio: 'Semiheliofita', cientifico: 'Escallonia paniculata', comun: 'Tibar', cantidad: 300 },
          { fase: 'Priseral', gremio: 'Semiheliofita', cientifico: 'Abatia parviflora', comun: 'Duraznillo', cantidad: 300 },
        ],
      },
      {
        tipo: 4, kind: 'enriquecimiento', titulo: 'Enriquecimiento dirigido (tipo 4)',
        especies: [
          { fase: 'Tardiseral', gremio: 'Umbrofila', cientifico: 'Drimys granadensis', comun: 'Canelo de paramo', cantidad: 63 },
          { fase: 'Tardiseral', gremio: 'Umbrofila - Semiheliofita', cientifico: 'Prunus buxifolia', comun: 'Uche', cantidad: 63 },
          { fase: 'Tardiseral', gremio: 'Semiheliofita', cientifico: 'Myrsine dependens', comun: 'Maiz tostado', cantidad: 63 },
          { fase: 'Mesoseral', gremio: 'Semiheliofita', cientifico: 'Escallonia myrtilloides', comun: 'Rodamonte', cantidad: 63 },
          { fase: 'Mesoseral', gremio: 'Semiheliofita', cientifico: 'Escallonia paniculata', comun: 'Tibar', cantidad: 63 },
          { fase: 'Mesoseral', gremio: 'Semiheliofita', cientifico: 'Hesperomeles goudotiana', comun: 'Mortiño', cantidad: 63 },
          { fase: 'Mesoseral', gremio: 'Semiheliofita', cientifico: 'Miconia squamulosa', comun: 'Tuno esmeraldo', cantidad: 63 },
          { fase: 'Mesoseral', gremio: 'Heliofita', cientifico: 'Morella pubescens', comun: 'Laurel de cera', cantidad: 63 },
          { fase: 'Mesoseral', gremio: 'Umbrofila', cientifico: 'Myrcianthes leucoxyla', comun: 'Arrayan', cantidad: 63 },
          { fase: 'Mesoseral', gremio: 'Semiheliofita', cientifico: 'Viburnum triphyllum', comun: 'Garrocho', cantidad: 63 },
          { fase: 'Mesoseral', gremio: 'Heliofita', cientifico: 'Xylosma spiculifera', comun: 'Corono', cantidad: 64 },
          { fase: 'Priseral', gremio: 'Semiheliofita', cientifico: 'Abatia parviflora', comun: 'Duraznillo', cantidad: 63 },
          { fase: 'Priseral', gremio: 'Heliofita', cientifico: 'Ageratina tinifolia', comun: 'Amargoso', cantidad: 63 },
          { fase: 'Priseral', gremio: 'Heliofita', cientifico: 'Baccharis latifolia', comun: 'Chilco', cantidad: 63 },
          { fase: 'Priseral', gremio: 'Semiheliofita', cientifico: 'Cestrum buxifolium', comun: 'Tinto', cantidad: 63 },
          { fase: 'Priseral', gremio: 'Semiheliofita', cientifico: 'Citharexylum subflavescens', comun: 'Cajeto', cantidad: 64 },
          { fase: 'Priseral', gremio: 'Heliofita', cientifico: 'Dodonaea viscosa', comun: 'Hayuelo', cantidad: 63 },
          { fase: 'Priseral', gremio: 'Semiheliofita', cientifico: 'Vallea stipularis', comun: 'Raque', cantidad: 63 },
          { fase: 'Priseral', gremio: 'Umbrofila', cientifico: 'Duranta mutisii', comun: 'Espino garbanzo', cantidad: 64 },
        ],
      },
    ],
  },
  {
    clave: 'nativo_chusque',
    nombre: 'Nativo con chusque',
    descripcion: 'Parches de vegetación nativa con presencia de chusque (Chusquea scandens)',
    modulos: [
      {
        tipo: 1, kind: 'nucleo_5sp', titulo: 'Núcleo sencillo 5 sp (tipo 1)',
        especies: [
          { fase: 'Tardiseral', gremio: 'Semiheliofita', cientifico: 'Myrsine coriacea', comun: 'Cucharo Blanco', cantidad: 250 },
          { fase: 'Mesoseral', gremio: 'Semiheliofita', cientifico: 'Miconia squamulosa', comun: 'Tuno Esmeraldo', cantidad: 250 },
          { fase: 'Mesoseral', gremio: 'Semiheliofita', cientifico: 'Oreopanax incisus', comun: 'Mano de Oso', cantidad: 250 },
          { fase: 'Priseral', gremio: 'Heliofita', cientifico: 'Ageratina tinifolia', comun: 'Amargoso', cantidad: 250 },
          { fase: 'Priseral', gremio: 'Heliofita', cientifico: 'Phyllanthus salviifolius', comun: 'Cedrillo', cantidad: 250 },
        ],
      },
      {
        tipo: 2, kind: 'nucleo_7sp', titulo: 'Núcleo sencillo 7 sp (tipo 2)',
        especies: [
          { fase: 'Tardiseral', gremio: 'Umbrofila - Semiheliofita', cientifico: 'Weinmannia tomentosa', comun: 'Encenillo', cantidad: 250 },
          { fase: 'Mesoseral', gremio: 'Semiheliofita', cientifico: 'Escallonia paniculata', comun: 'Tibar', cantidad: 250 },
          { fase: 'Mesoseral', gremio: 'Semiheliofita', cientifico: 'Hesperomeles goudotiana', comun: 'Mortiño', cantidad: 250 },
          { fase: 'Priseral', gremio: 'Semiheliofita', cientifico: 'Citharexylum subfavescens', comun: 'Cajeto', cantidad: 250 },
          { fase: 'Priseral', gremio: 'Semiheliofita', cientifico: 'Abatia parviflora', comun: 'Duraznillo', cantidad: 250 },
          { fase: 'Priseral', gremio: 'Semiheliofita', cientifico: 'Cestrum buxifolium', comun: 'Tinto', cantidad: 250 },
          { fase: 'Priseral', gremio: 'Semiheliofita', cientifico: 'Piper bogotense', comun: 'Cordoncillo', cantidad: 250 },
        ],
      },
      {
        tipo: 3, kind: 'triada', titulo: 'Triada (tipo 3)',
        especies: [
          { fase: 'Tardiseral', gremio: 'Umbrofila', cientifico: 'Clusia multiflora', comun: 'Gaque', cantidad: 250 },
          { fase: 'Mesoseral', gremio: 'Semiheliofita', cientifico: 'Macleania rupestris', comun: 'Uva Camarona', cantidad: 250 },
          { fase: 'Priseral', gremio: 'Semiheliofita', cientifico: 'Citharexylum subflavescens', comun: 'Cajeto', cantidad: 250 },
        ],
      },
    ],
  },
  {
    clave: 'nativa_sucesional',
    nombre: 'Nativa en estados sucesionales',
    descripcion: 'Parches de vegetación nativa en distintos estados sucesionales',
    modulos: [
      {
        tipo: 4, kind: 'enriquecimiento', titulo: 'Enriquecimiento dirigido (tipo 4)',
        especies: [
          { fase: 'Tardiseral', gremio: 'Umbrofila', cientifico: 'Drimys granadensis', comun: 'Canelo de paramo', cantidad: 12 },
          { fase: 'Tardiseral', gremio: 'Umbrofila - Semiheliofita', cientifico: 'Prunus buxifolia', comun: 'Uche', cantidad: 12 },
          { fase: 'Tardiseral', gremio: 'Semiheliofita - Heliofita', cientifico: 'Cedrella montana', comun: 'Cedro', cantidad: 13 },
          { fase: 'Tardiseral', gremio: 'Semiheliofita', cientifico: 'Myrsine dependens', comun: 'Maiz tostado', cantidad: 13 },
          { fase: 'Mesoseral', gremio: 'Semiheliofita', cientifico: 'Escallonia myrtilloides', comun: 'Rodamonte', cantidad: 13 },
          { fase: 'Mesoseral', gremio: 'Semiheliofita', cientifico: 'Escallonia paniculata', comun: 'Tibar', cantidad: 13 },
          { fase: 'Mesoseral', gremio: 'Semiheliofita', cientifico: 'Hesperomeles goudotiana', comun: 'Mortiño', cantidad: 12 },
          { fase: 'Mesoseral', gremio: 'Semiheliofita', cientifico: 'Miconia squamulosa', comun: 'Tuno esmeraldo', cantidad: 13 },
          { fase: 'Mesoseral', gremio: 'Heliofita', cientifico: 'Morella pubescens', comun: 'Laurel de cera', cantidad: 12 },
          { fase: 'Mesoseral', gremio: 'Umbrofila', cientifico: 'Myrcianthes leucoxyla', comun: 'Arrayan', cantidad: 13 },
          { fase: 'Mesoseral', gremio: 'Semiheliofita', cientifico: 'Viburnum triphyllum', comun: 'Garrocho', cantidad: 13 },
          { fase: 'Mesoseral', gremio: 'Heliofita', cientifico: 'Xylosma spiculifera', comun: 'Corono', cantidad: 12 },
          { fase: 'Priseral', gremio: 'Semiheliofita', cientifico: 'Abatia parviflora', comun: 'Duraznillo', cantidad: 13 },
          { fase: 'Priseral', gremio: 'Heliofita', cientifico: 'Ageratina tinifolia', comun: 'Amargoso', cantidad: 13 },
          { fase: 'Priseral', gremio: 'Heliofita', cientifico: 'Baccharis latifolia', comun: 'Chilco', cantidad: 12 },
          { fase: 'Priseral', gremio: 'Semiheliofita', cientifico: 'Cestrum buxifolium', comun: 'Tinto', cantidad: 12 },
          { fase: 'Priseral', gremio: 'Semiheliofita', cientifico: 'Citharexylum subflavescens', comun: 'Cajeto', cantidad: 12 },
          { fase: 'Priseral', gremio: 'Heliofita', cientifico: 'Dodonaea viscosa', comun: 'Hayuelo', cantidad: 12 },
          { fase: 'Priseral', gremio: 'Semiheliofita', cientifico: 'Vallea stipularis', comun: 'Raque', cantidad: 12 },
          { fase: 'Priseral', gremio: 'Umbrofila', cientifico: 'Duranta mutisii', comun: 'Espino garbanzo', cantidad: 13 },
        ],
      },
      {
        tipo: 3, kind: 'triada', titulo: 'Triada (tipo 3)',
        especies: [
          { fase: 'Tardiseral', gremio: 'Umbrofila', cientifico: 'Clusia multiflora', comun: 'Gaque', cantidad: 50 },
          { fase: 'Mesoseral', gremio: 'Semiheliofita', cientifico: 'Macleania rupestris', comun: 'Uva Camarona', cantidad: 50 },
          { fase: 'Priseral', gremio: 'Semiheliofita', cientifico: 'Piper bogotense', comun: 'Cordoncillo', cantidad: 50 },
        ],
      },
    ],
  },
  {
    clave: 'cordon_ripario',
    nombre: 'Cordón ripario',
    descripcion: 'Cordón ripario asociado a drenajes naturales',
    modulos: [
      {
        tipo: 4, kind: 'enriquecimiento', titulo: 'Enriquecimiento dirigido (tipo 4)',
        especies: [
          { fase: 'Tardiseral', gremio: 'Umbrofila', cientifico: 'Drimys granadensis', comun: 'Canelo de paramo', cantidad: 85 },
          { fase: 'Tardiseral', gremio: 'Umbrofila - Semiheliofita', cientifico: 'Prunus buxifolia', comun: 'Uche', cantidad: 85 },
          { fase: 'Tardiseral', gremio: 'Semiheliofita - Heliofita', cientifico: 'Cedrella montana', comun: 'Cedro', cantidad: 85 },
          { fase: 'Mesoseral', gremio: 'Heliofita', cientifico: 'Xylosma spiculifera', comun: 'Corono', cantidad: 85 },
          { fase: 'Mesoseral', gremio: 'Semiheliofita', cientifico: 'Escallonia paniculata', comun: 'Tibar', cantidad: 85 },
          { fase: 'Mesoseral', gremio: 'Semiheliofita', cientifico: 'Hesperomeles goudotiana', comun: 'Mortiño', cantidad: 85 },
          { fase: 'Mesoseral', gremio: 'Semiheliofita', cientifico: 'Miconia squamulosa', comun: 'Tuno esmeraldo', cantidad: 85 },
          { fase: 'Priseral', gremio: 'Semiheliofita', cientifico: 'Abatia parviflora', comun: 'Duraznillo', cantidad: 85 },
          { fase: 'Priseral', gremio: 'Heliofita', cientifico: 'Ageratina tinifolia', comun: 'Amargoso', cantidad: 85 },
          { fase: 'Priseral', gremio: 'Semiheliofita', cientifico: 'Cestrum buxifolium', comun: 'Tinto', cantidad: 85 },
          { fase: 'Priseral', gremio: 'Umbrofila', cientifico: 'Duranta mutisii', comun: 'Espino garbanzo', cantidad: 85 },
        ],
      },
    ],
  },
  {
    clave: 'nativo_exoticas_chusque',
    nombre: 'Nativo-exóticas-chusque',
    descripcion: 'Parches de vegetación nativa entre mezclada con plantación de especies forestales exóticas y chusque (Chusquea scandens)',
    modulos: [
      {
        tipo: 1, kind: 'nucleo_5sp', titulo: 'Núcleo sencillo 5 sp (tipo 1)',
        especies: [
          { fase: 'Tardiseral', gremio: 'Semiheliofita', cientifico: 'Myrsine coriacea', comun: 'Cucharo Blanco', cantidad: 200 },
          { fase: 'Mesoseral', gremio: 'Semiheliofita', cientifico: 'Miconia squamulosa', comun: 'Tuno Esmeraldo', cantidad: 200 },
          { fase: 'Mesoseral', gremio: 'Semiheliofita', cientifico: 'Oreopanax incisus', comun: 'Mano de Oso', cantidad: 200 },
          { fase: 'Priseral', gremio: 'Heliofita', cientifico: 'Ageratina tinifolia', comun: 'Amargoso', cantidad: 200 },
          { fase: 'Priseral', gremio: 'Heliofita', cientifico: 'Phyllanthus salviifolius', comun: 'Cedrillo', cantidad: 200 },
        ],
      },
      {
        tipo: 2, kind: 'nucleo_7sp', titulo: 'Núcleo sencillo 7 sp (tipo 2)',
        especies: [
          { fase: 'Tardiseral', gremio: 'Umbrofila - Semiheliofita', cientifico: 'Weinmannia tomentosa', comun: 'Encenillo', cantidad: 150 },
          { fase: 'Mesoseral', gremio: 'Semiheliofita', cientifico: 'Escallonia paniculata', comun: 'Tibar', cantidad: 150 },
          { fase: 'Mesoseral', gremio: 'Semiheliofita', cientifico: 'Hesperomeles goudotiana', comun: 'Mortiño', cantidad: 150 },
          { fase: 'Priseral', gremio: 'Semiheliofita', cientifico: 'Citharexylum subfavescens', comun: 'Cajeto', cantidad: 150 },
          { fase: 'Priseral', gremio: 'Semiheliofita', cientifico: 'Abatia parviflora', comun: 'Duraznillo', cantidad: 150 },
          { fase: 'Priseral', gremio: 'Semiheliofita', cientifico: 'Cestrum buxifolium', comun: 'Tinto', cantidad: 150 },
          { fase: 'Priseral', gremio: 'Semiheliofita', cientifico: 'Piper bogotense', comun: 'Cordoncillo', cantidad: 150 },
        ],
      },
      {
        tipo: 3, kind: 'triada', titulo: 'Triada (tipo 3)',
        especies: [
          { fase: 'Tardiseral', gremio: 'Umbrofila', cientifico: 'Clusia multiflora', comun: 'Gaque', cantidad: 100 },
          { fase: 'Mesoseral', gremio: 'Semiheliofita', cientifico: 'Macleania rupestris', comun: 'Uva Camarona', cantidad: 100 },
          { fase: 'Priseral', gremio: 'Semiheliofita', cientifico: 'Citharexylum subflavescens', comun: 'Cajeto', cantidad: 100 },
        ],
      },
      {
        tipo: 4, kind: 'enriquecimiento', titulo: 'Enriquecimiento dirigido (tipo 4)',
        especies: [
          { fase: 'Tardiseral', gremio: 'Umbrofila', cientifico: 'Drimys granadensis', comun: 'Canelo de paramo', cantidad: 50 },
          { fase: 'Tardiseral', gremio: 'Umbrofila - Semiheliofita', cientifico: 'Prunus buxifolia', comun: 'Uche', cantidad: 50 },
          { fase: 'Tardiseral', gremio: 'Umbrofila', cientifico: 'Clusia multiflora', comun: 'Gaque', cantidad: 50 },
          { fase: 'Tardiseral', gremio: 'Semiheliofita', cientifico: 'Myrsine dependens', comun: 'Maiz tostado', cantidad: 50 },
          { fase: 'Mesoseral', gremio: 'Semiheliofita', cientifico: 'Escallonia myrtilloides', comun: 'Rodamonte', cantidad: 50 },
          { fase: 'Mesoseral', gremio: 'Semiheliofita', cientifico: 'Escallonia paniculata', comun: 'Tibar', cantidad: 50 },
          { fase: 'Mesoseral', gremio: 'Semiheliofita', cientifico: 'Hesperomeles goudotiana', comun: 'Mortiño', cantidad: 50 },
          { fase: 'Mesoseral', gremio: 'Semiheliofita', cientifico: 'Miconia squamulosa', comun: 'Tuno esmeraldo', cantidad: 50 },
          { fase: 'Mesoseral', gremio: 'Heliofita', cientifico: 'Morella pubescens', comun: 'Laurel de cera', cantidad: 50 },
          { fase: 'Mesoseral', gremio: 'Umbrofila', cientifico: 'Myrcianthes leucoxyla', comun: 'Arrayan', cantidad: 50 },
          { fase: 'Mesoseral', gremio: 'Semiheliofita', cientifico: 'Viburnum triphyllum', comun: 'Garrocho', cantidad: 50 },
          { fase: 'Mesoseral', gremio: 'Heliofita', cientifico: 'Xylosma spiculifera', comun: 'Corono', cantidad: 50 },
          { fase: 'Priseral', gremio: 'Semiheliofita', cientifico: 'Abatia parviflora', comun: 'Duraznillo', cantidad: 50 },
          { fase: 'Priseral', gremio: 'Heliofita', cientifico: 'Ageratina tinifolia', comun: 'Amargoso', cantidad: 50 },
          { fase: 'Priseral', gremio: 'Heliofita', cientifico: 'Baccharis latifolia', comun: 'Chilco', cantidad: 50 },
          { fase: 'Priseral', gremio: 'Semiheliofita', cientifico: 'Cestrum buxifolium', comun: 'Tinto', cantidad: 50 },
          { fase: 'Priseral', gremio: 'Semiheliofita', cientifico: 'Citharexylum subflavescens', comun: 'Cajeto', cantidad: 50 },
          { fase: 'Priseral', gremio: 'Heliofita', cientifico: 'Dodonaea viscosa', comun: 'Hayuelo', cantidad: 50 },
          { fase: 'Priseral', gremio: 'Semiheliofita', cientifico: 'Vallea stipularis', comun: 'Raque', cantidad: 50 },
          { fase: 'Priseral', gremio: 'Umbrofila', cientifico: 'Duranta mutisii', comun: 'Espino garbanzo', cantidad: 50 },
        ],
      },
    ],
  },
]

// Simbología oficial por tipo de núcleo (colores de la cartografía del proyecto).
export interface TipoNucleoInfo { tipo: number; nombre: string; color: string }
export const TIPOS_NUCLEO: Record<number, TipoNucleoInfo> = {
  1: { tipo: 1, nombre: 'Núcleo sencillo 5 sp', color: '#22c55e' },
  2: { tipo: 2, nombre: 'Núcleo sencillo 7 sp', color: '#eab308' },
  3: { tipo: 3, nombre: 'Triada', color: '#3b82f6' },
  4: { tipo: 4, nombre: 'Enriquecimiento dirigido', color: '#f97316' },
}

export function getEscenario(clave: string): EscenarioDiseno | undefined {
  return ESCENARIOS.find(e => e.clave === clave)
}
export function getModulo(clave: string, tipo: number): ModuloDiseno | undefined {
  return getEscenario(clave)?.modulos.find(m => m.tipo === tipo)
}
export function tipoColor(tipo: number): string {
  return TIPOS_NUCLEO[tipo]?.color ?? '#6b7280'
}
export function tipoNombre(tipo: number): string {
  return TIPOS_NUCLEO[tipo]?.nombre ?? `Tipo ${tipo}`
}

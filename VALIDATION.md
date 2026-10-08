# Validación de 0.7.0

Prueba local del 7 de octubre de 2026, con Chromium y el HTML autónomo.

- 6 colecciones, 543 entradas y 486 obras distintas: cuatro listas NYT de 100 títulos, 75 ganadores Hugo y 68 Pulitzer.
- 39 libros compartidos; marcar, desmarcar, fecha y nota se reflejan en ambas listas.
- 486 imágenes locales decodificadas; navegación completa de las 543 entradas.
- Años de premio, años sin ganador y premios compartidos comprobados. Los ganadores se ordenan de 2026 a 1953.
- *Demon Copperhead* y *The Fifth Season* conservan marcas compartidas entre NYT y premios; las fichas muestran los reconocimientos y sus fuentes.
- *Blackout/All Clear* ocupa una entrada e indica que deben leerse ambos volúmenes.
- *Gone Girl* libro y película conservan estados independientes.
- Selecciones de temporada y las dos versiones de *The Office* separadas.
- Importación con revisión, coincidencias y omisión de líneas repetidas. Texto HTML tratado como texto.
- Contraste mínimo del texto visible: **4,92:1**, también con estilos blancos impuestos desde el anfitrión.
- Sin desbordamiento horizontal a 320, 390, 736 y 1024 píxeles; revisadas las seis colecciones.
- Sin errores de JavaScript ni solicitudes de red al abrir o recorrer el catálogo.
- Marcas, fechas, notas y listas propias sobreviven a recargar y cerrar/reabrir la página en Chromium.
- Exportación JSON descargada y restauración en un contexto limpio verificadas; restauración reversible tras recargar.
- Datos corruptos, versión desconocida, IDs maliciosos y JSON inválido rechazados sin sobrescribir el guardado previo.
- Fallos de cuota y cambios externos anuncian el problema; no se muestra éxito falso.
- Limitación: comportamiento `file://` dependiente del navegador; no se ha validado Safari/iOS ni sincronización entre dispositivos.

El informe detallado se regenera en `test-results/browser-audit.json` al ejecutar `tests/browser.cjs`.

Riesgo R1: prototipo local reversible. No se han desplegado servicios ni migrado datos personales. La persistencia es local y los respaldos son manuales; las imágenes y las listas conservan sus fuentes y derechos de origen. La decisión es mantener el HTML autónomo y los datos editables para esta versión.

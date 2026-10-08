# Validación de 0.11.0

Revisión del 8 de octubre de 2026 en Windows, con Python 3.14 y Microsoft Edge 154 mediante Playwright 1.62.1.

- Catálogo: 18 colecciones, 804 entradas y 726 obras distintas. Los 100 puestos, títulos y autores de /lit/ coinciden con la transcripción cotejada visualmente contra el gráfico final de 2025.
- Las 632 obras y 17 listas anteriores conservan exactamente sus datos e IDs. La colección nueva reutiliza seis obras y agrega 94; incorpora 52 portadas verificadas y conserva el indicador tipográfico donde falta una imagen confirmada.
- `tests/build.py` y las ocho pruebas de navegador aprobaron: catálogo, compatibilidad de actualización, países, Economía, importación, Literatura, impresión y almacenamiento.
- El guardado v1 de prueba previo a /lit/ conserva todas sus marcas, notas, fechas, obras y listas propias; las obras nuevas se pueden guardar sin alterar las anteriores. La carga inicial no sobrescribe el respaldo existente.
- Impresión: incluye las 100 obras aunque se active desde la segunda página de la interfaz, con estados y fechas actuales. Respeta títulos traducidos, años de premios y listas propias; los títulos con HTML se imprimen como texto. Abrir o cancelar no cambia el guardado, la selección ni la página de navegación.
- PDFs A4 renderizados y revisados visualmente en todas sus páginas: /lit/ completo en cuatro páginas y colección propia con títulos largos en una página. Marcas legibles, encabezados repetidos, filas completas y sin recortes ni solapamientos. Se verificó también la muestra NYT de 100 obras.
- Se recorrieron todas las colecciones y se comprobaron las 684 imágenes incorporadas. Contraste mínimo del texto: 4,92:1; sin desbordamiento en los tamaños de pantalla comprobados, errores de JavaScript ni solicitudes de red para recorrer el HTML local.

La vista de impresión usa el diálogo del navegador para elegir una impresora o guardar como PDF. El tamaño final puede variar con la configuración de impresión. La comprobación local se realizó en Edge/Chromium; no se ha validado Safari/iOS.

## Validación previa de 0.10.1

Revisión del 8 de octubre de 2026 en Windows, con Python 3.14 y Microsoft Edge mediante Playwright 1.62.1.

- Reconstrucción en la configuración regional predeterminada de Windows, sin activar el modo UTF-8 global. La prueba `tests/build.py` verifica Unicode, incrustación segura del catálogo, hash de scripts y salida reproducible.
- Las seis pruebas de navegador cubren el catálogo, países, Nobel de Literatura y Economía, almacenamiento e importación.
- Importar una obra con y sin año produce una sola referencia y conserva notas, fechas, marcas y colecciones anteriores tras recargar.
- Los títulos traducidos reconocidos por el catálogo reutilizan la obra existente. Se respetan años de estreno alternativos documentados y se mantienen separados los medios, años incompatibles y coincidencias ambiguas.
- Restaurar desde una pestaña que ya recibió cambios de otra se rechaza sin modificar el guardado reciente ni su copia para deshacer.
- Guardados y respaldos antiguos con referencias repetidas a una obra recuperan sus datos y orden. Las entidades duplicadas y las referencias inexistentes siguen rechazándose.
- Los guardados ilegibles o de versión desconocida siguen protegidos y pueden reemplazarse mediante una restauración explícita.
- Se conservan las 17 colecciones, 704 entradas, 632 obras distintas, IDs y esquema de guardado v1.

GitHub Pages publica mediante `.github/workflows/pages.yml` después de reconstruir y ejecutar estas comprobaciones en Chromium. No se publican ni migran datos personales: cada perfil de navegador mantiene su almacenamiento y debe importar manualmente un respaldo para pasar del archivo local a la web.

## Validación previa de 0.10.0

Prueba local del 7 de octubre de 2026, con Chromium y el HTML autónomo.

- 17 colecciones, 704 entradas y 632 obras distintas: cuatro listas NYT de 100 títulos, 75 ganadores Hugo, 68 Pulitzer y 56 entradas en nueve países y 78 obras del recorrido Nobel.
- 39 libros compartidos; marcar, desmarcar, fecha y nota se reflejan en ambas listas.
- Navegación completa del catálogo y decodificación de las imágenes incorporadas.
- Años de premio, años sin ganador y premios compartidos comprobados. Los ganadores se ordenan de 2026 a 1953.
- *Demon Copperhead* y *The Fifth Season* conservan marcas compartidas entre NYT y premios; las fichas muestran los reconocimientos y sus fuentes.
- *Blackout/All Clear* ocupa una entrada e indica que deben leerse ambos volúmenes.
- *Gone Girl* libro y película conservan estados independientes.
- Selecciones de temporada y las dos versiones de *The Office* separadas.
- Importación con revisión, coincidencias y omisión de líneas repetidas. Texto HTML tratado como texto.
- Contraste mínimo del texto visible: **4,92:1**, también con estilos blancos impuestos desde el anfitrión.
- Sin desbordamiento horizontal a 320, 390, 736 y 1024 píxeles; revisadas las dieciséis colecciones.
- Sin errores de JavaScript ni solicitudes de red al abrir o recorrer el catálogo.
- Marcas, fechas, notas y listas propias sobreviven a recargar y cerrar/reabrir la página en Chromium.
- Exportación JSON descargada y restauración en un contexto limpio verificadas; restauración reversible tras recargar.
- Datos corruptos, versión desconocida, IDs maliciosos y JSON inválido rechazados sin sobrescribir el guardado previo.
- Fallos de cuota y cambios externos anuncian el problema; no se muestra éxito falso.
- Limitación: comportamiento `file://` dependiente del navegador; no se ha validado Safari/iOS ni sincronización entre dispositivos.

El informe detallado se regenera en `test-results/browser-audit.json` al ejecutar `tests/browser.cjs`.

Riesgo R1: prototipo local reversible. No se han desplegado servicios ni migrado datos personales. La persistencia es local y los respaldos son manuales; las imágenes y las listas conservan sus fuentes y derechos de origen. La decisión es mantener el HTML autónomo y los datos editables para esta versión.

## Recorridos de países

- 9 países, 56 entradas: México 8; el resto 6. Cada recorrido conserva exactamente una película.
- Contador de obras completadas para listas mixtas; «Leído» y «Vista» según la obra.
- *La vida de los otros* comparte ID, marca y nota con *The Lives of Others*; conserva el año correspondiente a cada lista (2006/2007).
- Navegación agrupada y selector móvil por país; orden de obras y trilogía de Krauze preservados.
- Guardados de la versión 0.7.0 se recuperan con el mismo esquema v1 y aparecen automáticamente las nuevas colecciones.
- Reversión: volver al commit anterior del código; exportar antes un respaldo para conservar las marcas de obras nuevas.

Riesgo R1. Decisión: promover la actualización al repositorio privado después de las pruebas locales.

## Recorrido Nobel

- 78 obras y 27 años/autores (2000–2026), con las excepciones de dos obras en 2000 y una antología en 2011.
- 11 IDs existentes reutilizados, sin perder marcas ni notas compartidas.
- Tres discos guardan el estado «Escuchado» tras recargar; teatro identificado como lectura.
- Las fichas indican «premio al autor» y enlazan el resumen oficial del año.
- La presentación traducida del título no altera la ficha base ni el almacenamiento.
- Reversión al commit 0.8.0 posible; exportar antes un respaldo y conservar 0.9.0 para leer datos del nuevo tipo Música.

## Economía

- 27 libros, 23 años seleccionados; coautorías conservadas.
- Fichas del premio de Economía diferenciadas de Literatura; nota de *Reforming Pensions* comprobada.
- Marca de lectura conservada después de recargar.
- Colecciones anteriores y esquema de guardado v1 conservados.

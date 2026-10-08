# Validación de 0.10.0

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

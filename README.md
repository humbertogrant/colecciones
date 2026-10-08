# Colecciones

Un archivo personal para marcar libros leídos, películas y series vistas, y guardar una línea de recuerdo. Prototipo autónomo con la identidad Canto 1.0.1.

## Abrir

Abrí `index.html` en un navegador. Incluye fuentes, catálogo e imágenes; no necesita servidor ni conexión. Los enlaces de las fuentes se abren en una pestaña nueva.

**Las marcas, fechas, recuerdos y colecciones propias se guardan automáticamente en este navegador.** Los recuerdos se confirman con «Guardar recuerdo». «Guardado y respaldos» indica si la operación tuvo éxito y permite exportar un JSON, revisar un respaldo antes de restaurarlo y deshacer la última restauración.

No hay cuenta ni sincronización entre dispositivos. El guardado de archivos `file://` depende del navegador y la ubicación del HTML; mover o renombrar el archivo, cambiar de navegador o borrar los datos puede separar o eliminar ese almacenamiento. Exportá un respaldo antes. Para uso continuo conviene una dirección web estable; esta versión no se ha desplegado.

Un respaldo contiene marcas, notas, fechas y listas propias, sin imágenes. Restaurarlo **reemplaza** esos datos; las seis colecciones incluidas permanecen. La versión previa se conserva localmente para deshacer. Los respaldos son archivos JSON legibles: guardalos donde guardás tus documentos personales. Ningún dato se envía a un servidor.

## Colecciones incluidas

| Colección | Edición | Obras |
| --- | --- | ---: |
| Libros: la crítica | 2024 | 100 |
| Libros: el público | 2024 | 100 |
| Películas del siglo XXI | 2025 | 100 |
| Series del siglo XXI | 2026 | 100 |
| Hugo: mejor novela | 1953–2026 | 75 |
| Pulitzer: ficción | 1953–2026 | 68 |

Hay 543 entradas y 486 obras distintas. Las dos listas de libros del NYT comparten 39 títulos; 18 ganadores de premios ya figuran en ellas. Una obra compartida conserva el mismo estado, fecha y nota. Una adaptación a otro medio tiene una ficha independiente. Las listas comienzan sin marcas; se retiraron las cuatro colecciones de muestra.

Se respetan los puestos originales y las selecciones de temporadas: *Beef* y *True Detective* incluyen sólo la primera; *Twin Peaks: The Return* corresponde a 2017. Las versiones británica y estadounidense de *The Office* tienen fichas distintas.

## Agregar una lista

En **Nueva colección**, pegá un título por línea. Podés usar `Título | Autor o director | Año`. Revisá las coincidencias antes de crearla. Se admiten hasta 150 títulos por lista; se omiten las líneas idénticas repetidas.

Las coincidencias requieren el mismo medio, título y creador; si ambos registros tienen año, debe coincidir. Una coincidencia ambigua no se combina automáticamente.

## Editar y reconstruir

- `src/colecciones.html`: interfaz, estilos e interacciones.
- `src/fonts.css`: Bodoni Moda e IBM Plex Sans incrustadas.
- `data/catalog.json`: obras, listas y procedencia de las imágenes. El orden de `items` representa el puesto en las listas NYT y el año descendente en los premios. `itemMeta` registra el año de concesión, los premios compartidos y la fuente de cada ganador.
- `assets/covers/`: miniaturas locales.
- `scripts/build.py`: genera `index.html` sin dependencias adicionales.
- `tests/storage.cjs`: prueba reapertura, respaldos, restauración, errores de cuota y datos inválidos.
- `tests/browser.cjs`: comprobación de catálogos, imágenes, contraste, navegación y marcas compartidas.

```sh
python3 scripts/build.py
```

Para ejecutar la comprobación de navegador, instalá Playwright y su Chromium en el entorno de desarrollo, y ejecutá `node tests/browser.cjs`. Las variables opcionales `PLAYWRIGHT_MODULE` y `CHROMIUM_PATH` permiten usar una instalación existente.

## Fuentes y alcance

La procedencia, las fechas y los criterios de edición están en [SOURCES.md](SOURCES.md). Cada colección enlaza a su lista original y cada imagen tiene un enlace de crédito en la ficha. Los títulos conservan el idioma de las listas. No se incluyen reseñas del periódico.

El código y el diseño del prototipo son independientes del periódico. Las portadas, carteles y fuentes tipográficas conservan sus derechos y licencias de origen; ver [SOURCES.md](SOURCES.md) y `assets/licenses/`.

## Cambios y reversión

Versión 0.7.0: guardado local versionado, respaldo JSON, restauración revisable y reversible, validación de entradas y protección ante errores de guardado o cambios en otra pestaña. Se conservan las seis colecciones.

Versión 0.6.0: añade dos colecciones de ganadores, Hugo a mejor novela y Pulitzer de ficción, para 1953–2026. Se incluyen los premios compartidos, se explicitan los años sin ganador y se excluyen los Retro-Hugos. El año de premio no se confunde con el año de publicación. *Blackout/All Clear* conserva una ficha para ambos volúmenes. Se conserva la corrección de contraste de los contadores y la tipografía aprobada.

Para revertir tras subirlo a GitHub, usá `git revert` sobre el commit de esta versión, o restaurá el HTML anterior. Reconstruir el archivo no modifica los datos fuente. No hay backend, despliegue ni migraciones.

## Modelo de datos y reversión

El catálogo de obras permanece separado de los datos personales. La clave `canto.colecciones.personal.v1` guarda un documento con `format`, `version`, `savedAt`, `works` y `lists`. Las obras guardan ID estable y estado/nota/fecha; los metadatos del catálogo incorporado conservan prioridad al cargar. Las listas personales apuntan a esos IDs. No se persisten portadas.

Se rechazan versiones desconocidas, IDs duplicados o inseguros, referencias rotas y archivos mayores de 2 MB. Los datos ilegibles no se sobrescriben automáticamente. Una segunda pestaña que detecta cambios detiene sus escrituras y pide exportar/recargar; no hay edición concurrente fusionada. La comparación previa a escritura reduce conflictos, pero localStorage no ofrece transacciones entre pestañas: usar una sola pestaña para editar.

La última restauración puede deshacerse desde la interfaz, incluso tras recargar. Antes de volver al HTML anterior, exportá un respaldo: la versión 0.6.0 no lee estos datos y volvería a funcionar sólo por sesión. No se borran claves al actualizar el HTML.

Riesgo R1, prototipo local. Decisión: promover a prueba personal con respaldos; sincronización y cuentas siguen pendientes.

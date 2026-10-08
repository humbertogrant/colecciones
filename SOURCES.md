# Fuentes del catálogo

Corte de esta versión: 7 de octubre de 2026. Se incorporan títulos, autores o directores, orden y enlaces; no se reproducen reseñas ni el diseño del periódico.

| Colección | Fuente original | Contraste del listado |
| --- | --- | --- |
| Libros: la crítica · 2024 | [NYT Book Review](https://www.nytimes.com/interactive/2024/books/best-books-21st-century.html) | Catálogo de 100 títulos ya verificado en la versión anterior. |
| Libros: el público · 2024 | [Readers Pick Their 100 Best Books](https://www.nytimes.com/interactive/2024/books/reader-best-books-21st-century.html) | [Reproducción del listado en Bathtub Bulletin](https://bathtubbulletin.com/the-100-best-books-of-the-21st-century-according-to-readers/). |
| Películas · 2025 | [100 Best Movies of the 21st Century](https://www.nytimes.com/interactive/2025/movies/best-movies-21st-century.html) | [Lista completa en MWN Lifestyle](https://mwnlifestyle.com/2025/12/22/the-new-york-times-names-the-100-best-movies-of-the-21st-century/) y [transcripción CSV](https://gist.github.com/mvark/2273ae29bfc5d7033016df4b6cebbc6d). |
| Series · 2026 | [100 Best TV Shows of the 21st Century](https://www.nytimes.com/interactive/2026/arts/television/best-tv-shows-21st-century.html) | [Lista completa en Inbound SA](https://inboundsa.com/100-best-tv-shows-21st-century-full-list/). |

Las páginas originales se enlazan para consulta; las tres nuevas se cotejaron mediante las transcripciones accesibles indicadas. En películas se verificaron los 100 puestos entre las dos transcripciones. Se conservaron los títulos completos de *Borat* y *Anchorman*, y la variante *The Gleaners & I*.

## Criterios de edición

- Libros: título y autor; se omite el año para no mezclar primera edición original, traducción y edición de la portada. Las portadas pueden corresponder a distintas ediciones.
- Películas: los años del listado corresponden a su estreno estadounidense y pueden diferir del estreno mundial. Se conserva esa convención, por ejemplo *Memories of Murder* (2005 en la lista; película de 2003).
- Series: se muestra el año inicial de la selección, sin hacer afirmaciones sobre su continuidad actual. *Beef (Season 1)* y *True Detective (Season 1)* son selecciones de temporada; *Twin Peaks: The Return* corresponde a la temporada de 2017. *The Office (U.K.)* y *The Office (U.S.)* no se combinan.
- Las 39 coincidencias entre las listas de libros se resolvieron por título y autor normalizados; cada obra tiene un identificador estable independiente de su puesto.

## Imágenes y tipografías

El campo `coverUrl` conserva la procedencia de cada imagen; `editionUrl` es la página enlazada desde su ficha. Las miniaturas se guardan localmente para que el prototipo abra sin conexión.

- Libros: [Open Library](https://openlibrary.org/), excepto *Septology*, con imagen de [Fitzcarraldo Editions](https://fitzcarraldoeditions.com/), y *Kafka on the Shore* y *The Bee Sting*, con portadas de sus fichas de Wikipedia. Son portadas editoriales, no imágenes creadas para este prototipo.
- Películas: imágenes de las fichas de [Wikipedia](https://en.wikipedia.org/), con enlace a cada artículo. El enlace no convierte las imágenes en contenido libre: cada archivo conserva la licencia o condiciones indicadas en su origen.
- Series: [TVmaze](https://www.tvmaze.com/api). Los metadatos de TVmaze están disponibles bajo [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/); se atribuyen y se conserva el enlace a la ficha o temporada correspondiente. Las imágenes mantienen los derechos de sus titulares.
- Tipografías: Bodoni Moda e IBM Plex Sans, SIL Open Font License. Se incluyen sus textos de licencia en `assets/licenses/`.

No se otorga una licencia nueva sobre las portadas, carteles, listas o identidad Canto. Este paquete corresponde a un prototipo personal.

## Premios literarios · 1953–2026

- **Hugo: mejor novela**: 75 ganadores de los premios anuales, sin Retro-Hugos. [Historial oficial](https://www.thehugoawards.org/hugo-history/), páginas de cada año y [resultados oficiales de 2026](https://www.thehugoawards.org/2026/08/2026-hugo-awards-results/). La tabla de [Best Novel](https://en.wikipedia.org/wiki/Hugo_Award_for_Best_Novel) se utilizó para extraer el histórico y cotejarlo con las páginas oficiales. El sitio conserva la página de 1985 bajo el slug `1995-hugo-awards-2`; se mantiene su enlace real.
- **Pulitzer: ficción**: 68 obras, extraídas del [historial oficial de Fiction](https://www.pulitzer.org/prize-winners-by-category/219), incluyendo los dos ganadores de 2023. Incluye novelas y libros de relatos.
- Orden descendente por año de concesión. No se crean tarjetas para años sin ganador: Hugo, 1954 y 1957; Pulitzer, 1954, 1957, 1964, 1971, 1974, 1977 y 2012.
- Premios Hugo compartidos en 1966, 1993 y 2010; Pulitzer compartido en 2023. Cada obra cuenta por separado. *Blackout/All Clear* (2011) es una sola entrada: novela en dos volúmenes.
- Se muestran *Way Station* y *This Immortal* con sus títulos editoriales conocidos; sus fichas conservan los títulos de concesión, *Here Gather the Stars* y *...And Call Me Conrad*. Las colecciones de Katherine Anne Porter y Jean Stafford incluyen el nombre de la autora para evitar ambigüedad.
- 18 ganadores reutilizan las fichas existentes del NYT. Las 125 obras nuevas incorporan portadas de Open Library. Cada ficha conserva el enlace de procedencia. Una portada puede corresponder a una edición distinta a la premiada.

## Descubrimiento de países · 8 de octubre de 2026

Selección y orden proporcionados directamente por Humberto en la conversación: nueve países, 56 obras. No se presenta como lista del NYT ni como selección premiada. La trilogía de Enrique Krauze se desglosa en tres títulos. La selección de *Rostam* acredita a Dick Davis en la ficha.

Los títulos y nombres dados se conservan por recorrido mediante `displayItems`, sin duplicar las cuatro obras ya existentes. Esa presentación no modifica los IDs ni el estado personal; permite mostrar títulos traducidos y la fecha de estreno original de *La vida de los otros* sin alterar la lista NYT.

Las nuevas portadas proceden de Open Library, salvo *The Japanese*, de la ficha editorial de Penguin (https://www.penguin.co.uk/books/316626/the-japanese-by-harding-christopher/9780141992280); los carteles proceden de las fichas de Wikipedia; cada imagen incorporada conserva su crédito y URL. Las ediciones pueden estar en un idioma diferente al título del recorrido. Cuando no se ha identificado una portada con suficiente certeza, la tarjeta lo indica y continúa funcionando.

## Nobel: lecturas y escuchas · 8 de octubre de 2026

La selección de 78 obras, su orden y los títulos mostrados fueron proporcionados por Humberto. El año corresponde al Nobel de Literatura del autor, no a la publicación ni a un premio a cada libro o disco. La procedencia institucional se enlaza en cada ficha mediante el resumen oficial del año: https://www.nobelprize.org/prizes/lists/all-nobel-prizes-in-literature/. Anne Carson (2026) se verificó con la ficha oficial https://www.nobelprize.org/prizes/literature/2026/carson/facts/ y la noticia de Reuters del 8 de octubre de 2026.

Las portadas nuevas proceden de Open Library, salvo *Trilogía*, de [Dalkey Archive Press](https://dalkeyarchive.store/products/trilogy), y las carátulas de Dylan de su sitio oficial (https://www.bobdylan.com/albums/); cada archivo mantiene su URL y crédito. Se permiten ediciones en otro idioma, sin cambiar los títulos de la selección. Las variantes idiomáticas se resuelven mediante `displayItems`; once obras reutilizan IDs existentes. El campo `laureateYear`, separado de `awardYear`, evita presentar las obras seleccionadas como ganadoras del Nobel.

## Nobel: economía · 8 de octubre de 2026

Selección, años y notas proporcionados por Humberto. Las fichas enlazan el resumen oficial de cada año en https://www.nobelprize.org/prizes/economic-sciences/. El premio de 2025 se contrastó con https://www.nobelprize.org/prizes/economic-sciences/2025/press-release/. Se conservan los premiados del año separados de los autores del libro. Las portadas proceden de Open Library, salvo *Giving Kids a Fair Chance*, de MIT Press (https://mitpress.mit.edu/9780262535052/giving-kids-a-fair-chance/), y pueden corresponder a otra edición o idioma; cada ficha conserva su procedencia.

## 4chan /lit/: 100 libros · Edición 2025

La colección reproduce la votación anual de 2025 del foro literario `/lit/` de 4chan, publicada en enero de 2026. Es la edición anual más reciente localizada al 8 de octubre de 2026; no se encontró una edición anual de 2026. No se mezcla con el agregado de una década ni con las votaciones específicas de ciencia ficción y fantasía.

- **Fuente del orden y los 100 títulos:** [gráfico final del organizador, «/lit/'s Top 100 Books 2025»](https://i.warosu.org/data/lit/img/0250/04/1767927719687207.png), conservado en el [anuncio original archivado del 9 de enero de 2026](https://warosu.org/lit/thread/25004995). Se cotejaron visualmente los 100 puestos numerados; se conserva el orden publicado, incluso cuando la entrada agrupa varias obras.
- **Contraste auxiliar:** la [hoja de desempate enlazada por el gráfico](https://files.catbox.moe/l3dqaw.ods) identifica 75 de las entradas. Se utilizó para contrastar títulos y autores, no para recalcular o sustituir el orden del gráfico final. La [republicación del 21 de enero de 2026 en r/classicliterature](https://www.reddit.com/r/classicliterature/comments/1qj6498/the_lit_top_100_books_list_for_2025/) confirma la circulación de esta edición. No se utilizó el agregado histórico de 102 obras.
- **Presentación:** se conservan los títulos en inglés del gráfico, uniendo los cortes de línea y ampliando los apellidos a nombres completos. La Biblia figura como obra de varios autores; *Beowulf* y *The Epic of Gilgamesh*, como anónimos. Se omite el año editorial para no confundir el original, una traducción y la edición de una portada.
- **Entradas colectivas:** se mantienen en una sola ficha *The Lord of the Rings*, los *Dialogues* de Platón, *The First Folio*, *In Search of Lost Time*, las *Tragedies* de Esquilo y Sófocles, los *Poems* de Eliot y Yeats, *The Ring of the Nibelung*, *The Trilogy* de Beckett y *Cthulhu Mythos*. Las notas de lectura explican el alcance sin convertir un conjunto en una obra individual. El ciclo de Wagner se registra como lectura de sus textos, no como una grabación musical.
- **Identidad compartida:** seis obras reutilizan sus IDs anteriores: *War and Peace* / *Guerra y paz*, *The Old Man and the Sea*, *2666*, *The Master and Margarita* / *El maestro y Margarita*, *A Confederacy of Dunces* y *Dune*. Las variantes inglesas de las dos obras rusas se guardan en `displayItems`; las fichas anteriores, sus nombres y sus IDs no cambian. Se añaden 94 obras nuevas: el catálogo pasa a 18 colecciones, 804 entradas y 726 obras distintas.
- **Portadas · revisión 0.11.1:** las 100 entradas incluyen miniaturas locales verificadas. Se completaron las 42 que faltaban en la primera publicación y se sustituyeron escaneos de encuadernaciones poco legibles. Las fuentes incluyen Open Library y las editoriales citadas en cada ficha mediante `coverUrl`, `editionUrl` y `coverSource`. La edición se contrastó por título, autor, ISBN o ficha bibliográfica; se descartaron adaptaciones, imágenes de sustitución, volúmenes parciales y ediciones abreviadas. Para los conjuntos se verificó el alcance: Platón (Complete Works), First Folio (facsímil), Proust (seis volúmenes íntegros), Esquilo y Sófocles (tragedias completas), Schopenhauer (ambos volúmenes), poemas de Eliot y Yeats (recopilaciones), Beckett (las tres novelas), Wagner (los cuatro dramas) y Lovecraft (The Complete Cthulhu Mythos Tales). Las portadas pueden representar ediciones o idiomas distintos del título mostrado; no alteran el alcance de la entrada ni sus datos personales. Las imágenes conservan los derechos de sus titulares.

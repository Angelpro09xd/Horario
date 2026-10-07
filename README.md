# Horario 2º GM · I.E.S. Alfonso XI

Aplicación web del horario de **2º de Grado Medio (Sistemas Microinformáticos y Redes)**
del I.E.S. Alfonso XI (Alcalá la Real), curso 2026/2027.

El horario manda: está en primer plano, siempre sabe qué toca ahora, cuánto queda y qué
viene después. Alrededor, lo justo para no necesitar otra app: tareas, exámenes, notas y
apuntes por materia.

> Interfaz pensada a la vez para **ordenador** (carril lateral, rejilla semanal completa,
> atajos de teclado y paleta de comandos) y para **Android** (barra inferior, vista de día
> con gestos, botón flotante, hojas deslizantes e instalación como app).

---

## Qué hace

| | |
|---|---|
| **Horario semanal** | Rejilla completa de lunes a viernes con los bloques tal y como están en el parte oficial: las sesiones dobles se muestran unidas, el recreo tiene su franja y la clase en curso late con una línea de tiempo real. |
| **Ahora** | Materia actual con cuenta atrás en un anillo, progreso de la jornada, lo que queda del día y un radar con lo más cercano. |
| **Modo foco** | Pantalla completa con la cuenta atrás gigante y un **pomodoro** 25/5 integrado. |
| **Tareas** | Agrupadas por urgencia (atrasadas, hoy, esta semana…), con materia, prioridad y progreso. |
| **Exámenes** | Cuenta atrás en días, notas del temario y creación de una tarea de repaso en un toque. |
| **Notas** | Media ponderada por materia y media global, con la línea del aprobado. |
| **Materias** | Ficha de cada módulo: profesorado, horas semanales, dónde cae en el horario y apuntes propios. |
| **Ajustes** | Cinco lenguajes visuales, doce paletas, acento personalizado, control del cristal, efectos, avisos y exportación de datos. |

### Cinco lenguajes visuales

La piel no es un cambio de color: cambia la **forma, la materia, la tipografía y
el movimiento**. El color va aparte, así que cualquiera de las doce paletas
funciona con cualquiera de las cinco pieles.

| Piel | De qué va |
|---|---|
| **Liquid Glass** | Capas translúcidas con desenfoque, bordes luminosos, auroras de fondo y una constelación de puntos. Lo que había. |
| **Material Expressive** | El lenguaje de Google recreado: superficies tonales sin desenfoque, esquinas muy generosas que **se deforman al pulsar**, capas de estado en vez de sombras, indicador de píldora en la navegación, progreso **ondulado** con su punto final, y movimiento con muelle. |
| **Telemetría** | Lenguaje propio. Nada es redondo: las esquinas se cortan en chaflán. Todo se mide, con retículas y reglillas de cotas en los bordes de cada panel. Tipografía monoespaciada en versalitas. El color no rellena, señala: cada materia es un testigo luminoso y un raíl de 3 px. El movimiento es de máquina: barridos de escaneo, parpadeos y revelados por cortina. |
| **Apple HIG** | Las *Human Interface Guidelines* aplicadas de verdad, no imitadas: el cristal líquido vive **solo en la capa funcional** (barras, carril, hojas) y la capa de contenido es opaca — poner cristal en tarjetas y filas es, según su propia lista de revisión, un defecto. Claro u oscuro **lo decide el sistema**, nunca un ajuste de la app. Escala Dynamic Type con San Francisco. El acento se reserva a la acción principal, y el color de las materias vive en el contenido, que es donde las guías dicen que debe estar. Movimiento breve y preciso. |
| **Papel Riso** | Lenguaje propio, y el único en claro. Es papel: fondo crema, trama de semitono y fibra. Tinta plana, sin degradados ni brillos. La profundidad se dibuja con sombras duras desplazadas. El registro es imperfecto, cada pieza se imprime un par de píxeles desviada, y las tarjetas caen con un grado de más o de menos. |

Paletas: Aurora, Synth, Toxic, Solar, Ice, Vapor, Carbon, Nebulosa, Menta,
Cobalto, Brasa y Sakura.

### Detalles que quizá no se ven a la primera

- **Festivos y vacaciones**: los días no lectivos se atenúan en la rejilla y el carril lleva
  una cuenta atrás al próximo festivo.
- **Avisos** antes de cada clase (con la antelación que elijas) mientras la app está abierta.
- **Funciona sin conexión**: se instala como PWA y guarda todo en el propio dispositivo.
- **Paleta de comandos** (`Ctrl/⌘ + K` o `K`) para ir a cualquier sitio o cambiar de tema.
- **Gestos**: desliza a los lados para cambiar de día o de sección en el móvil.
- **Sin servidores**: nada de cuentas, nada de nube. Tus datos se exportan e importan en JSON.
- **Refracción de verdad**: el bisel del cristal no solo empaña el fondo, lo *desvía*.
  Un mapa de desplazamiento calculado con la ley de Snell dobla la imagen de detrás en
  el borde de cada pieza, con su reflejo especular. Ajustable en tres niveles.
- **Las tarjetas se inclinan** hacia el cursor en las pieles con profundidad, y cada
  lenguaje tiene su propia animación de entrada: muelle, cortina o caída sobre el papel.
- **Movimiento reducido** desactiva de golpe partículas, inclinación y animaciones.
- **Ajustes sinceros**: cada piel solo muestra los controles que de verdad usa.
  En Apple HIG no hay deslizador de cristal, porque la materia la fija el lenguaje.

### Atajos

| Tecla | Acción |
|---|---|
| `1` … `7` | Cambiar de sección |
| `K` / `Ctrl+K` | Paleta de comandos |
| `F` | Modo foco |
| `N` | Nueva tarea |
| `T` | Ir a hoy |
| `←` `→` | Cambiar de día |
| `↑` `↓` `Re Pág` `Av Pág` `Inicio` `Fin` | Desplazar la vista |
| `Espacio` | Pausar el pomodoro |
| `Esc` | Cerrar |

---

## Cómo se usa

Es una web estática: no hay que compilar nada.

```bash
# con cualquier servidor estático
npx http-server -p 8080 .
# o
python3 -m http.server 8080
```

Y abrir `http://localhost:8080`. En GitHub Pages funciona publicando la rama `main`.

> Para instalarla en Android: abrir la web en Chrome → menú → *Añadir a pantalla de inicio*.
> También aparece un botón de instalación en **Ajustes → Acerca de** cuando el navegador lo permite.

---

## Estructura

```
index.html                 armazón y capas de fondo
manifest.webmanifest       instalación como app
sw.js                      caché offline
exams.json                 exámenes iniciales (se importan la primera vez)
css/
  core.css                 tokens, paletas y tipografía
  fx.css                   cristal líquido, neón, partículas y animaciones
  layout.css               armazón PC / Android
  components.css           botones, campos, listas, modales, gráficos
  views.css                rejilla del horario, panel de ahora, foco
  skin-apple.css           lenguaje Apple HIG
  skin-material.css        lenguaje Material Expressive
  skin-hud.css             lenguaje Telemetría
  skin-paper.css           lenguaje Papel Riso
js/
  data.js                  horario, materias, profesorado y calendario
  store.js                 estado y persistencia local
  skins.js                 lenguajes visuales y color de materia por piel
  glass.js                 refracción del cristal (mapas de desplazamiento y filtro SVG)
  time.js                  qué toca ahora, bloques y cuentas atrás
  ui.js                    helpers de DOM, iconos, modales y avisos
  fx.js                    fondo animado, sonido y vibración
  notify.js                recordatorios antes de clase
  focus.js                 modo foco + pomodoro
  palette.js               paleta de comandos
  views-schedule.js        horario, ahora y materias
  views-study.js           tareas, exámenes, notas y ajustes
  app.js                   enrutado, atajos y ciclo de vida
```

## El horario

Transcrito del parte oficial «Grupos de alumnos · 2º GM» (Peñalara, 14/09/2026):
30 periodos lectivos semanales repartidos en siete módulos.

| Código | Materia | Profesor/a | h/semana |
|---|---|---|---|
| SERRE | Servicios en Red | Jesús Álvarez Jiménez | 6 |
| IPE II | Itinerario Personal para la Empleabilidad II | Francisco José Mesa Castillo | 3 |
| APLWE | Aplicaciones Web | María Dolores Muñoz Muñoz | 7 |
| INGPRO | Inglés Profesional | Juan Antonio Peña Martín | 2 |
| SIOPR | Sistemas Operativos en Red | Antonia Prats Campos | 6 |
| SINF | Seguridad Informática | Paula Rochina García | 4 |
| PI | Proyecto Intermodular | Nuria María Rodríguez Navarro | 2 |

Tramos: 8:30–9:30 · 9:30–10:30 · 10:30–11:30 · **recreo 11:30–12:00** · 12:00–13:00 · 13:00–14:00 · 14:00–15:00.

Si cambia algo del horario, se edita `js/data.js` (`TIMETABLE`, `SUBJECTS`, `CALENDAR`) y listo.


---

## Sobre la piel Apple HIG

Está escrita contra el espejo de las *Human Interface Guidelines* de
[dickwu/apple-design-skill](https://github.com/dickwu/apple-design-skill), citando
sus páginas:

| Regla | De dónde sale |
|---|---|
| El cristal solo en la capa funcional; el contenido, opaco | `liquid-glass.md › The two layers` y su lista de revisión, punto 1 |
| Claro y oscuro los decide el sistema | `dark-mode.md › Best practices` |
| Acento para la acción principal y los indicadores de estado; etiquetas monocromas | `color.md › Liquid Glass color` |
| El color de marca se lleva al contenido, y el cristal lo recoge | `branding.md › Best practices` |
| Borde difuminado donde el contenido se encuentra con una barra | `layout.md › Visual hierarchy` |
| Escala Dynamic Type «Large»: 34/28/22/20/17/17/16/15/13/12/11 | `typography.md › iOS, iPadOS Dynamic Type sizes` |
| Desenfoque de 20–40 px, saturación ×1,2–1,5, filo de medio píxel | `liquid-glass.md › Cross-platform translation` |
| Movimiento breve, sin animar lo que se repite mucho | `motion.md › Best practices` |
| Respuesta a transparencia reducida, contraste alto y movimiento reducido | lista de revisión, punto 5 |

Dos consecuencias que se notan: la piel **Liquid Glass** de esta app no cumple esa
primera regla (pone cristal en tarjetas y celdas, que es el defecto que la guía
describe), y la piel **Apple HIG** es la única sin ajuste propio de apariencia,
porque las guías piden obedecer al sistema.


---

## Sobre la refracción del cristal

Un `backdrop-filter: blur()` solo empaña lo que hay detrás. El cristal de verdad
además lo **desvía**: la luz se dobla al entrar y salir del bisel, así que el borde
de cada pieza arrastra y estira la imagen del fondo, y un reflejo especular recorre
ese mismo bisel.

`js/glass.js` lo hace así, con la técnica de
[archisvaze/liquid-glass](https://github.com/archisvaze/liquid-glass) reescrita para
esta app:

1. Se calcula el perfil de refracción del bisel con la **ley de Snell**, a partir del
   grosor del cristal, el ancho del bisel y el índice de refracción (1,48).
2. Ese perfil se pinta en un **mapa de desplazamiento**: en cada píxel del bisel, los
   canales R y G codifican cuánto se desvía la imagen en x e y.
3. Un segundo mapa pinta el **brillo especular** del bisel según el ángulo de la luz.
4. Un filtro SVG encadena `feImage` → `feDisplacementMap` → especular, y se aplica
   con `backdrop-filter: url(#filtro)`.

Detalles que importan:

- **Solo Chromium** admite `backdrop-filter: url()`. En Firefox y Safari no se toca
  nada y queda el desenfoque de siempre.
- Los filtros **se comparten por tamaño**: todas las celdas del horario que miden lo
  mismo usan uno solo. Las piezas grandes se calculan a media resolución.
- Cuesta alrededor de un **27 % más** que un desenfoque normal, así que hay tres
  niveles en Ajustes — *toda la interfaz*, *solo barras*, *apagada* — y en equipos
  modestos o en el móvil arranca en «solo barras».
- Se apaga sola con *movimiento reducido* o *transparencia reducida*.

Para que esto funcione hubo que arreglar algo que llevaba oculto desde el principio:
las capas de fondo (aurora, orbes, partículas) estaban en `z-index` negativo, y el
navegador **no las captura** como fondo de un `backdrop-filter`. Es decir, el cristal
nunca había desenfocado la aurora, solo el contenido. Ahora están en el flujo normal,
por debajo de la app, y el cristal por fin las recoge. Por el mismo motivo, las
animaciones de entrada sueltan su clase al terminar: una animación que se queda
«rellenando» sobre `opacity` mantiene compuesto a su contenedor y lo convierte en
raíz de fondo, dejando al cristal de dentro sin nada que ver.

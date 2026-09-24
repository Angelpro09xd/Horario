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
| **Ajustes** | Cuatro lenguajes visuales, doce paletas, acento personalizado, control del cristal, efectos, avisos y exportación de datos. |

### Cuatro lenguajes visuales

La piel no es un cambio de color: cambia la **forma, la materia, la tipografía y
el movimiento**. El color va aparte, así que cualquiera de las doce paletas
funciona con cualquiera de las cuatro pieles.

| Piel | De qué va |
|---|---|
| **Liquid Glass** | Capas translúcidas con desenfoque, bordes luminosos, auroras de fondo y una constelación de puntos. Lo que había. |
| **Material Expressive** | El lenguaje de Google recreado: superficies tonales sin desenfoque, esquinas muy generosas que **se deforman al pulsar**, capas de estado en vez de sombras, indicador de píldora en la navegación, progreso **ondulado** con su punto final, y movimiento con muelle. |
| **Telemetría** | Lenguaje propio. Nada es redondo: las esquinas se cortan en chaflán. Todo se mide, con retículas y reglillas de cotas en los bordes de cada panel. Tipografía monoespaciada en versalitas. El color no rellena, señala: cada materia es un testigo luminoso y un raíl de 3 px. El movimiento es de máquina: barridos de escaneo, parpadeos y revelados por cortina. |
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
- **Las tarjetas se inclinan** hacia el cursor en las pieles con profundidad, y cada
  lenguaje tiene su propia animación de entrada: muelle, cortina o caída sobre el papel.
- **Movimiento reducido** desactiva de golpe partículas, inclinación y animaciones.

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
  skin-material.css        lenguaje Material Expressive
  skin-hud.css             lenguaje Telemetría
  skin-paper.css           lenguaje Papel Riso
js/
  data.js                  horario, materias, profesorado y calendario
  store.js                 estado y persistencia local
  skins.js                 lenguajes visuales y color de materia por piel
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

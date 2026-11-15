# Música de fondo de Equilibria (`audio-ambiente.js`)

`cinematic/resources/ambiente.wav` suena en bucle, sin cortes. **Hoy solo se usa en la cinemática**
(`cinematic/index.html`): avatar, test de habilidades, mapa lunar y bienvenida LUNIA ya tienen su propia
música, y añadir esta encima haría sonar dos a la vez. Si una pantalla sin música propia la incluye, la retoma
en la misma posición en que la dejó la pantalla anterior.

La cinemática además tiene su música de intro (`cinematic/resources/intro_equilibria.wav`, en
`cinematic.js`) y, de fondo en la portada, el video de la Luna (`Luna_desde_tierra_1.webm`) que se alterna en
bucle con el del glitch (`Error-fatal-glitch.webm`).

## Cómo se añade a una pantalla

```html
<script src="../audio/audio-ambiente.js"></script>   <!-- ../ según la profundidad de la carpeta -->
```

Atributos opcionales de esa etiqueta:

| Atributo | Qué hace |
|---|---|
| `data-volumen="0.5"` | Volumen de la música en esa pantalla (0 a 1, por defecto 0.5). |
| `data-reiniciar` | Empieza desde el segundo 0 (solo la primera pantalla, `cinematic/index.html`). |
| `data-sin-aviso` | No muestra el aviso "toca la pantalla para activar la música". |

## Cómo funciona

- **Bucle sin corte:** dos `<audio>` que se solapan con un fundido cruzado de 4 s al final de cada vuelta.
- **Entre pantallas:** guarda la posición en `sessionStorage['equilibria:ambiente']` y la retoma en la
  página siguiente sumando el tiempo transcurrido. Entre páginas hay un corte de unas décimas de segundo
  inevitable en el navegador; se suaviza con un fundido de entrada.
- **Autoplay:** intenta sonar al cargar; si el navegador lo bloquea, arranca con el primer clic, toque o tecla.
- **Volumen del bus de música:** se recuerda en `localStorage['equilibria:audio']`.

## API (`window.AudioAmbiente`)

| Llamada | Efecto |
|---|---|
| `iniciar()` / `reanudar()` | Empieza o retoma la música (devuelve una promesa con `true` si ya suena). |
| `pausar(ms)` | Pausa con fundido de salida. |
| `volumen(v, ms)` | Volumen del bus de música, 0 a 1. Se recuerda entre pantallas. |
| `silenciar(true/false)` / `alternarSilencio()` | Silencio. |
| `atenuar(factor, ms)` | Baja la música temporalmente sin tocar su volumen (`atenuar(1)` la restaura). |
| `estado()` | `{sonando, silenciado, bloqueado, volumen, posicion, duracion, ...}` |
| `ctx` | `AudioContext` común del juego. |
| `busSfx` | `GainNode` para efectos; independiente del volumen de la música. |
| `conectarTone(Tone)` | Hace `Tone.setContext(ctx)` y devuelve `busSfx`. |

Eventos en `window`: `ambiente:sonando`, `ambiente:bloqueado`.

## Usar Tone.js en tus propios sonidos

`lib/tone.min.js` es Tone.js 15.1.22 (MIT) tal cual, sin modificar. La música va por un elemento de audio
normal (así funciona al abrir los archivos con doble clic) y Tone suena aparte, en el mismo `AudioContext`:

```js
const bus = AudioAmbiente.conectarTone(Tone);        // Tone usa el AudioContext común
const synth = new Tone.Synth().connect(bus);         // tus efectos pasan por el bus de efectos
document.addEventListener('click', () => synth.triggerAttackRelease('C5', '8n'));
```

`AudioAmbiente.volumen()`, `silenciar()` y `atenuar()` solo afectan a la música. El volumen de los efectos es
`AudioAmbiente.busSfx.gain.value`. Si ya cargaste `sfx.js`, Tone ya está configurado: usa `AudioSfx.Tone`.

---

# Efectos de sonido (`sfx.js`)

Efectos sci-fi sintetizados con Tone.js (osciladores, FM, ruido filtrado y un eco ligero): **no hay ni un archivo
de audio**. Está en todas las pantallas; cada una solo necesita (después de `audio-ambiente.js` si la usa):

```html
<script src="../audio/sfx.js"></script>
```

Funciona también sin `audio-ambiente.js`: en ese caso crea su propio `AudioContext` con el primer gesto y no
baja ninguna música al sonar (el barrido de `entrada` al cambiar de pantalla solo suena donde está la música
continua, es decir, en la cinemática).

Tone.js (`lib/tone.min.js`) se descarga solo en un momento libre tras abrir la página y los instrumentos se
crean con el primer clic, toque o tecla (así respeta el bloqueo de autoplay). Los efectos salen por el bus de
efectos (`AudioAmbiente.busSfx`) y, con los sonidos grandes, la música baja sola un momento y vuelve
(`AudioAmbiente.golpe()`). Si la música está silenciada (botón "Música y efectos" de la cinemática), los efectos
también.

## Qué suena y cuándo

| Sonido | Se dispara con |
|---|---|
| `tecla` | Cada tecla (tic mínimo, con tono aleatorio; sin repeticiones al mantenerla). |
| `hover` | Cursor sobre un botón o elemento clicable (muy bajo). |
| `clic` | Clic en un botón, tarjeta o canvas. |
| `seleccion` | Casillas, opciones, selectores y elementos tipo ficha (`.segb`, `.tog`, `.opcion`, `.card`). |
| `suave` | "Saltar", "Volver", "Cerrar", "Ver de nuevo" y la tecla Esc. |
| `confirmar` | "Aceptar", "Listo", "Guardar", enviar un formulario o el evento `equilibria:login`. |
| `salida` | Botones de avanzar: "Siguiente", "Continuar", "Comenzar", "Iniciar", "Despegar"… |
| `entrada` | Al abrir una pantalla venida de otra (solo si el navegador ya permite audio). |
| `error` | Clase `error` / `incorrecto` / `fallo` / `wrong` / `shake` puesta en un elemento. |
| `exito` | Clase `correcto` / `acierto` / `success`. |
| `logro` | Clase `completa` / `completado`. |
| `revelar` | Clase `revelada`. |
| `portada` | La portada EQUILIBRIA emerge al terminar la intro. |
| `glitch` | Entra el video del glitch en el fondo de la portada. |
| `transmision` | Botón "Recibir transmisión". |
| `despegue`, `alerta`, `radio` | Solo a mano: `AudioSfx.play('despegue')`. |

Para decidir el sonido de un elemento concreto: `data-sfx="logro"` (o `data-sfx="off"` para silenciarlo).
Desde código: `AudioSfx.play('error')` o `window.dispatchEvent(new CustomEvent('eq:sfx', {detail: 'glitch'}))`.

Opciones en la etiqueta `<script>` de `sfx.js`: `data-sin-teclas`, `data-sin-clic`, `data-sin-hover`.
`test-habilidades` usa `data-sin-clic data-sin-hover` porque ya tiene sus propios sonidos de respuesta.

## Cómo probarlos

Abre cualquier pantalla, haz un clic (activa el audio) y en la consola del navegador (F12):

```js
AudioSfx.nombres.forEach((n, i) => setTimeout(() => AudioSfx.play(n), i * 1500));  // los oye todos, uno tras otro
AudioSfx.play('despegue');       // uno solo
AudioSfx.registro                // últimos sonidos disparados (para ver qué sonó con cada acción)
AudioSfx.volumen(0.5)            // volumen de los efectos (se recuerda)
AudioSfx.silenciar(true)         // silenciar solo los efectos
```

## Peso añadido

| Archivo | Peso | Comprimido (gzip) |
|---|---|---|
| `lib/tone.min.js` | 345 KB | 80 KB |
| `audio/sfx.js` | 17 KB | 6 KB |
| `lib/tone-LICENSE.txt` | 1 KB | |

Sin archivos de audio nuevos. Tone.js se carga una vez y el navegador lo reutiliza en el resto de pantallas.

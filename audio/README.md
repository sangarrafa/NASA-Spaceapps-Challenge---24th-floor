# Música de fondo de Equilibria (`audio-ambiente.js`)

`cinematic/resources/ambiente.wav` suena en bucle en todas las pantallas, sin cortes, con la misma
posición al pasar de una pantalla a otra.

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

## Usar Tone.js con la música

La música va por un `<audio>` normal (así funciona al abrir los archivos con doble clic, donde el navegador
no deja decodificarlos con Web Audio). Tone.js suena aparte, en el mismo `AudioContext` común:

```html
<script src="https://unpkg.com/tone"></script>   <!-- o una copia local, como three.js -->
<script src="../audio/audio-ambiente.js"></script>
<script>
  const bus = AudioAmbiente.conectarTone(Tone);        // Tone usa AudioAmbiente.ctx
  const synth = new Tone.Synth().connect(bus);         // los efectos pasan por busSfx
  document.addEventListener('click', async () => {
    await Tone.start();                                // necesita un gesto del usuario
    synth.triggerAttackRelease('C5', '8n');
  });
  // Para que un efecto largo no tape la música:
  // AudioAmbiente.atenuar(0.3, 400); ...al terminar... AudioAmbiente.atenuar(1, 800);
</script>
```

`AudioAmbiente.volumen()` y `silenciar()` solo afectan a la música; el volumen de los efectos se controla
con `AudioAmbiente.busSfx.gain.value`.

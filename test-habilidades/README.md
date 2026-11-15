# Test de súper habilidades

Cuestionario de 5 pruebas que la Comandante Ríos le hace al astronauta después de la cinemática. Asigna una especialidad basada en el modelo de jugadores de Bartle.

Abrir `index.html` (funciona con doble clic, sin servidor). Con `?debug` se ve el perfil completo al final, útil para el pitch. Con `?siguiente=ruta` se cambia adónde lleva "Ir a la misión" (por defecto `../game.html`).

## Personaje secreto y revelación

- La pantalla de preguntas está dividida en tercios. En el tercio derecho hay una silueta oscura de astronauta que se llena un 10 % con cada respuesta, con un líquido vibrante y destellos dorados (`personajes.js` y `personajes.css`). El color no depende del perfil, para no revelar nada antes de tiempo.
- Hay cuatro astronautas finales, uno por especialidad: Explorador (aqua, linterna de casco, antena y telescopio), Piloto de Récords (dorado, franjas, alas y trofeo), Guardián (rosado, escudo con corazón, audífonos y botiquín) y Estratega Solar (violeta, capa, emblema del Sol y tableta holográfica).
- La pantalla final es un minijuego: hay que tocar rápido la nube de vapor (unos 29 toques; si se deja de tocar, el vapor vuelve poco a poco). Funciona con la barra espaciadora o Enter. Después de 9 segundos aparece "Revelar sin el juego".

## Profundidad con Three.js

- `profundidad.js` usa Three.js r186 guardado en `lib/three.r186.min.js` (licencia MIT en `lib/three-LICENSE.txt`), así sigue funcionando con doble clic y sin internet.
- Escenas: el dibujo SVG se separa en capas (fondo, entorno, personajes, primer plano) que se mueven a distinta velocidad con una cámara que se mece despacio y sigue al puntero. En los exteriores, el cielo es 3D (estrellas a distintas distancias, nebulosas y estrellas fugaces). Delante flota polvo brillante y en el podio cae confeti 3D.
- Los astronautas respiran (el torso y la cabeza suben y bajan un poco, cada uno a su ritmo).
- Revelación: la nube es volumétrica (64 bocanadas a distintas profundidades), cada toque suelta chispas doradas y empuja el vapor, y al revelar hay un estallido del color del personaje con onda expansiva.
- Si el navegador no tiene WebGL, o si se pide "reducir movimiento", todo vuelve a las animaciones SVG y CSS de antes.

## Sonidos


- `audio/ambiente.wav`: suena en bucle al 5 % (constante `VOLUMEN_MUSICA` al inicio de `test.js`) desde "¡Empezar!" y se corta cuando suena el efecto final.
- `audio/respuesta.wav`: suena cada vez que se elige una respuesta.
- `audio/revelacion.wav`: suena con el primer toque de la nube, cuando empieza a despejarse (o al usar "Revelar sin el juego").

## Escenas y voz

- Las 10 pruebas tienen una escena animada (`escenas.js` y `escenas.css`, SVG dibujado en código, sin imágenes). Siempre aparece el mismo astronauta. La pregunta se "proyecta" letra por letra mientras corre la escena.
- La voz de la Comandante (`voz.js`) dice cada frase por separado y hace una pausa entre frases. Si existe `audio/<clave>.mp3`, lo usa. Si no, usa la voz del navegador, y en Microsoft Edge esa voz es la misma voz neural gratuita.
- Para grabar los MP3 con la voz neural de Edge (por defecto `es-CO-SalomeNeural`, un poco más lenta y aguda):

  ```
  pip install edge-tts
  python herramientas/generar-voces.py
  ```

  Si cambian los textos, hay que regenerar `herramientas/frases.json` antes de grabar. Ese archivo es la lista de frases con su clave, la misma que calcula `EqVoz.clave()`.

## Archivos

- `preguntas.js`: las 10 pruebas, las 4 especialidades y las reacciones de la Comandante.
- `perfil-astronauta.js`: cálculo, guardado y API para el juego (`window.EquilibriaPerfil`).
- `test.js` y `test.css`: interfaz, con la paleta y tipografías de la cinemática.

## Especialidades y Bartle

| Letra | Especialidad | Bartle |
|---|---|---|
| 🔭 E | Explorador de Cráteres | Explorer |
| 🏅 T | Piloto de Récords | Achiever |
| 🤝 G | Guardián de la Tripulación | Socializer |
| 🧠 S | Estratega Solar | Killer canalizado contra el planeta: tormenta solar como jefe final y récords personales, nunca contra otros niños |

## Cálculo

1. Especialidad (pruebas 1 a 5: cueva, día libre, premio, lo mejor de jugar y mensaje de la Tierra): la letra con más puntos. Si hay empate, el niño elige entre las insignias empatadas.
2. Riesgo y apoyo: hoy no hay preguntas que los midan (se quitaron las de las capas 2 y 3), así que el perfil guarda 0 puntos en ambos (`cauteloso` y `ligero`). Si se vuelven a medir, basta con añadir preguntas con `capa: 2` (riesgo) o `capa: 3` (apoyo) en `preguntas.js`: 0–1 cauteloso / ligero, 2 equilibrado / medio, 3–4 audaz / alto.

Al niño solo se le muestra la especialidad.

## Uso desde el juego

```html
<script src="../test-habilidades/perfil-astronauta.js"></script>
<script>
  const perfil = EquilibriaPerfil.cargar();     // null si no hizo el test
  perfil.especialidad.id;                       // 'E' | 'T' | 'G' | 'S'
  perfil.oculto.riesgo.estilo;                  // 'cauteloso' | 'equilibrado' | 'audaz'
  perfil.oculto.apoyo.nivel;                    // 'ligero' | 'medio' | 'alto'
  perfil.adaptacion;                            // pistas, curva de dificultad, soles suaves, tono de LUNIA...

  // Cuando el niño enfrenta el dilema real del oxígeno en una misión:
  EquilibriaPerfil.registrarConducta('experimento', 2, { mision: 'mision-04' });
  EquilibriaPerfil.compararDeclaradoVsReal();   // [{ dilema, dijo, hizo, coincide, tendencia }]
</script>
```

El perfil se guarda en `localStorage` con la clave `equilibria:perfil`. También se escribe `outpost:profile` (`{ name, archetype }`) para que el prototipo actual `game.html` siga funcionando.

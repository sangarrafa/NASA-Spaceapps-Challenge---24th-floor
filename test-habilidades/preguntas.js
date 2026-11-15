/* Test de súper habilidades · datos
   Modelo de Bartle (1996): dos ejes, acción ↔ interacción y jugadores ↔ mundo.
   E  Explorador de Cráteres     → Explorer   (interactúa con el mundo)
   T  Piloto de Récords          → Achiever   (actúa sobre el mundo)
   G  Guardián de la Tripulación → Socializer (interactúa con otros)
   S  Estratega Solar            → Killer canalizado: compite "contra el planeta"
                                   (tormenta solar como jefe final, récords
                                   personales), nunca contra otros niños.

   Capa 1 (1-6): cada respuesta suma 1 punto a una especialidad.
   Capa 2 (7-8): estilo ante el riesgo, 🏃 2 · 🤔 1 · 🐢 0.
   Capa 3 (9-10): nivel de apoyo, más puntos = más apoyo.
   Las capas 2 y 3 nunca se muestran al niño. */

window.EQ_ESPECIALIDADES = {
  E: {
    id: 'E', clave: 'explorador', bartle: 'explorer', arquetipoJuego: 'explorer',
    icono: '🔭', color: '#6FE3E8',
    nombre: 'Explorador de Cráteres',
    lema: 'Tu súper habilidad es la curiosidad.',
    descripcion: 'Descubres secretos que nadie más ve y quieres saber cómo funciona todo por dentro.',
    lunia: '¡Qué bien! Tengo datos secretos de la NASA guardados. Te los iré mostrando cuando los descubras.',
    ganchos: ['fichas de datos reales NASA desbloqueables (DONKI, OSDR)', 'modo laboratorio: "¿qué pasa si...?"', 'rincones y detalles escondidos']
  },
  T: {
    id: 'T', clave: 'piloto', bartle: 'achiever', arquetipoJuego: 'achiever',
    icono: '🏅', color: '#FFB547',
    nombre: 'Piloto de Récords',
    lema: 'Tu súper habilidad es la constancia.',
    descripcion: 'Te pones metas, las cumples y luego vas por una más difícil.',
    lunia: '¡Genial! Te prepararé misiones con estrellas. A ver cuántas consigues.',
    ganchos: ['misiones con estrellas ("sobrevive 30 soles sin bajar del 20 % de oxígeno")', 'insignias (ingeniero de energía)', 'barras de progreso y colecciones', 'récords personales']
  },
  G: {
    id: 'G', clave: 'guardian', bartle: 'socializer', arquetipoJuego: 'socializer',
    icono: '🤝', color: '#E8418C',
    nombre: 'Guardián de la Tripulación',
    lema: 'Tu súper habilidad es cuidar a los demás.',
    descripcion: 'Contigo nadie se queda atrás. Juntos, la tripulación llega más lejos.',
    lunia: '¡Ya no estoy sola! Te presentaré a la tripulación y te llegarán mensajes desde la Tierra.',
    ganchos: ['tripulación con nombre y personalidad', 'mensajes desde la Tierra con retraso de comunicación', 'modo de clase o de parejas']
  },
  S: {
    id: 'S', clave: 'estratega', bartle: 'killer', bartleCanalizado: 'competencia contra el planeta',
    arquetipoJuego: 'challenger',
    icono: '🧠', color: '#A78BFA',
    nombre: 'Estratega Solar',
    lema: 'Tu súper habilidad es pensar antes de actuar.',
    descripcion: 'Miras todo, haces un plan y lo sigues. Cuando el Sol se enoje, tu plan nos va a salvar.',
    lunia: 'El Sol se está despertando... Contigo y tu plan, ¡vamos a ganarle a la tormenta solar!',
    ganchos: ['tormenta solar como jefe final', 'récords personales contra el planeta, nunca contra otros niños', 'planificación de presupuesto de energía']
  }
};

/* Reacciones de la Comandante entre preguntas: siempre positivas y sin revelar
   el perfil. Se reparten sin repetirse hasta agotar la lista (9 transiciones). */
window.EQ_REACCIONES = [
  '¡Interesante! Así piensan los buenos astronautas.',
  'Anotado en tu expediente.',
  '¡Hmm! Ya empiezo a ver tu súper habilidad...',
  'Esa respuesta dice mucho de ti. ¡Sigamos!',
  // Variaciones de "Esa respuesta dice mucho de ti"
  'Me gusta cómo piensas. ¡Vamos con la siguiente!',
  'Con eso ya te conozco un poquito más. ¡Adelante!',
  '¡Buena elección, Astronauta! Sigamos.',
  'Tu expediente se está poniendo muy interesante.',
  'Eso me cuenta algo importante de ti. ¡Continuemos!',
  '¡Ajá! Una pieza más del rompecabezas.',
  'Respuesta guardada. ¡Lo estás haciendo genial!',
  'Así se responde con el corazón. ¡Próxima prueba!',
  'Muy bien. Cada respuesta me ayuda a preparar tu misión.',
  '¡Excelente! La Academia toma nota.',
  'Cada respuesta me acerca a tu súper habilidad. ¡Sigue así!'
];

window.EQ_PREGUNTAS = [
  // ---------- CAPA 1: ¿Qué te motiva? ----------
  { n: 1, capa: 1, id: 'cueva', titulo: 'La cueva misteriosa',
    texto: 'Caminando por la Luna, encuentras una cueva que no aparece en ningún mapa. ¿Qué haces?',
    opciones: [
      { e: '🔦', t: 'Entro a ver qué hay adentro', v: 'E' },
      { e: '🏆', t: 'Me reto a llegar al fondo lo más rápido posible', v: 'T' },
      { e: '📡', t: 'Llamo a mi equipo para entrar juntos', v: 'G' },
      { e: '🗺️', t: 'Primero miro bien y planeo por dónde ir', v: 'S' } ] },
  { n: 2, capa: 1, id: 'dia-libre', titulo: 'Un día libre',
    texto: '¡Hoy no hay tareas en la base! ¿Qué te gustaría hacer?',
    opciones: [
      { e: '🔧', t: 'Abrir un robot viejo para ver cómo funciona por dentro', v: 'E' },
      { e: '🎮', t: 'Practicar en el simulador para subir de nivel', v: 'T' },
      { e: '💬', t: 'Pasar tiempo con la tripulación y ayudar a alguien', v: 'G' },
      { e: '📋', t: 'Organizar las provisiones de toda la semana', v: 'S' } ] },
  { n: 3, capa: 1, id: 'premio', titulo: 'El premio',
    texto: 'Al final de tu misión, la Academia te dará un premio. ¿Cuál escoges?',
    opciones: [
      { e: '🗺️', t: 'Un mapa con lugares que nadie ha visitado', v: 'E' },
      { e: '🥇', t: 'Una medalla dorada de “Mejor Astronauta”', v: 'T' },
      { e: '📸', t: 'Una foto con toda tu tripulación', v: 'G' },
      { e: '📕', t: 'Un manual secreto con trucos de comandante', v: 'S' } ] },
  { n: 4, capa: 1, id: 'companero', titulo: 'Un compañero en problemas',
    texto: 'Otro astronauta no logra arreglar su panel solar. ¿Qué haces?',
    opciones: [
      { e: '🧪', t: 'Probamos cosas nuevas para ver qué pasa', v: 'E' },
      { e: '⚡', t: 'Le muestro cómo lo arreglé yo, ¡fue rapidísimo!', v: 'T' },
      { e: '🤗', t: 'Me quedo ayudándolo hasta que funcione', v: 'G' },
      { e: '🔍', t: 'Revisamos juntos qué pieza falla y hacemos un plan', v: 'S' } ] },
  { n: 5, capa: 1, id: 'jugar', titulo: 'Lo mejor de jugar',
    texto: '¿Qué es lo más divertido de un juego para ti?',
    opciones: [
      { e: '🗝️', t: 'Descubrir secretos escondidos', v: 'E' },
      { e: '🏁', t: 'Ganar y pasar de nivel', v: 'T' },
      { e: '👫', t: 'Jugar con mis amigos', v: 'G' },
      { e: '♟️', t: 'Pensar una estrategia que funcione', v: 'S' } ] },
  { n: 6, capa: 1, id: 'mensaje', titulo: 'Un mensaje de la Tierra',
    texto: 'Te llega un mensaje desde la Tierra. ¿Qué te gustaría que dijera?',
    opciones: [
      { e: '🌌', t: '“Encontramos un lugar nuevo para que explores”', v: 'E' },
      { e: '📈', t: '“¡Rompiste un récord de la Academia!”', v: 'T' },
      { e: '💌', t: '“Tu familia te manda un abrazo gigante”', v: 'G' },
      { e: '🛰️', t: '“Necesitamos tu plan para una misión difícil”', v: 'S' } ] },

  // ---------- CAPA 2: ¿Cómo enfrentas el riesgo? ----------
  { n: 7, capa: 2, id: 'caminos', titulo: 'Dos caminos',
    texto: 'Para llegar a la base hay dos caminos: uno corto con rocas sueltas y uno largo pero seguro.',
    opciones: [
      { e: '🏃', t: 'El corto, ¡llego antes!', v: 2 },
      { e: '🤔', t: 'Miro las rocas de cerca y después decido', v: 1 },
      { e: '🐢', t: 'El largo, mejor ir seguro', v: 0 } ] },
  { n: 8, capa: 2, id: 'experimento', titulo: 'El experimento',
    // Adelanta un dilema real del juego: se compara después con lo que hace en la partida.
    texto: 'Los científicos te piden un experimento que gasta parte del oxígeno de reserva, pero podría ser un gran descubrimiento.',
    opciones: [
      { e: '🏃', t: '¡Lo hago ya!', v: 2 },
      { e: '🤔', t: 'Lo hago solo si me queda suficiente oxígeno', v: 1 },
      { e: '🐢', t: 'No lo hago, el oxígeno es lo primero', v: 0 } ] },

  // ---------- CAPA 3: ¿Cómo vives los retos difíciles? ----------
  { n: 9, capa: 3, id: 'robot', titulo: 'El robot que no funciona',
    texto: 'Intentas armar un robot y, después de varios intentos, sigue sin funcionar. ¿Qué haces?',
    opciones: [
      { e: '💪', t: 'Sigo intentando yo solo hasta lograrlo', v: 0 },
      { e: '💡', t: 'Pido una pista pequeñita y sigo', v: 1 },
      { e: '🙋', t: 'Le pido a alguien que me muestre cómo', v: 2 },
      { e: '😤', t: 'Me enojo un poquito y lo dejo para después', v: 2 } ] },
  { n: 10, capa: 3, id: 'sentir', titulo: '¿Cómo te sientes?',
    texto: 'Cuando algo nuevo te sale mal la primera vez, te sientes...',
    opciones: [
      { e: '😎', t: 'Tranquilo, lo intento otra vez', v: 0 },
      { e: '😕', t: 'Un poco triste, pero sigo', v: 1 },
      { e: '😣', t: 'Frustrado, prefiero que me ayuden', v: 2 } ] }
];

/* ---------- English ----------
   Si el jugador eligió inglés en la cinemática, se reemplazan los textos visibles.
   Los ids, valores y puntajes no cambian. */
if (window.EqLang && window.EqLang.get() === 'en') {
  const ES = window.EQ_ESPECIALIDADES;
  Object.assign(ES.E, { nombre: 'Crater Explorer', lema: 'Your superpower is curiosity.',
    descripcion: 'You discover secrets nobody else sees and want to know how everything works inside.',
    lunia: 'Great! I have secret NASA data stored away. I’ll show it to you as you discover it.' });
  Object.assign(ES.T, { nombre: 'Record Pilot', lema: 'Your superpower is persistence.',
    descripcion: 'You set goals, reach them and then go for a harder one.',
    lunia: 'Awesome! I’ll prepare missions with stars for you. Let’s see how many you get.' });
  Object.assign(ES.G, { nombre: 'Crew Guardian', lema: 'Your superpower is caring for others.',
    descripcion: 'With you, nobody gets left behind. Together, the crew goes further.',
    lunia: 'I’m not alone anymore! I’ll introduce you to the crew, and you’ll get messages from Earth.' });
  Object.assign(ES.S, { nombre: 'Solar Strategist', lema: 'Your superpower is thinking before acting.',
    descripcion: 'You look at everything, make a plan and follow it. When the Sun gets angry, your plan will save us.',
    lunia: 'The Sun is waking up... With you and your plan, we’re going to beat the solar storm!' });

  window.EQ_REACCIONES = [
    'Interesting! That’s how good astronauts think.',
    'Noted in your file.',
    'Hmm! I’m starting to see your superpower...',
    'That answer says a lot about you. Let’s keep going!',
    'I like the way you think. On to the next one!',
    'Now I know you a little better. Let’s go!',
    'Good choice, Astronaut! Let’s keep going.',
    'Your file is getting really interesting.',
    'That tells me something important about you. Let’s continue!',
    'Aha! One more piece of the puzzle.',
    'Answer saved. You’re doing great!',
    'That’s answering from the heart. Next test!',
    'Very good. Every answer helps me prepare your mission.',
    'Excellent! The Academy takes note.',
    'Every answer gets me closer to your superpower. Keep it up!'
  ];

  const EN = {
    'cueva': ['The mysterious cave', 'Walking on the Moon, you find a cave that isn’t on any map. What do you do?',
      ['I go in to see what’s inside', 'I challenge myself to reach the bottom as fast as I can', 'I call my team so we go in together', 'First I look carefully and plan where to go']],
    'dia-libre': ['A day off', 'There are no chores at the base today! What would you like to do?',
      ['Open up an old robot to see how it works inside', 'Practice in the simulator to level up', 'Spend time with the crew and help someone', 'Organize the supplies for the whole week']],
    'premio': ['The prize', 'At the end of your mission, the Academy will give you a prize. Which one do you choose?',
      ['A map of places nobody has visited', 'A gold “Best Astronaut” medal', 'A photo with your whole crew', 'A secret handbook with commander tricks']],
    'companero': ['A teammate in trouble', 'Another astronaut can’t fix their solar panel. What do you do?',
      ['We try new things to see what happens', 'I show them how I fixed mine. It was super fast!', 'I stay and help until it works', 'We check together which part is failing and make a plan']],
    'jugar': ['The best part of playing', 'What’s the most fun part of a game for you?',
      ['Discovering hidden secrets', 'Winning and leveling up', 'Playing with my friends', 'Thinking up a strategy that works']],
    'mensaje': ['A message from Earth', 'You get a message from Earth. What would you like it to say?',
      ['“We found a new place for you to explore”', '“You broke an Academy record!”', '“Your family sends you a giant hug”', '“We need your plan for a hard mission”']],
    'caminos': ['Two paths', 'There are two paths to the base: a short one with loose rocks and a long but safe one.',
      ['The short one, I get there first!', 'I look at the rocks up close and then decide', 'The long one, better to be safe']],
    'experimento': ['The experiment', 'The scientists ask you for an experiment that uses part of the reserve oxygen, but it could be a big discovery.',
      ['I do it right now!', 'I only do it if I have enough oxygen left', 'I don’t do it, oxygen comes first']],
    'robot': ['The robot that won’t work', 'You try to build a robot and, after several tries, it still doesn’t work. What do you do?',
      ['I keep trying on my own until I get it', 'I ask for a tiny hint and keep going', 'I ask someone to show me how', 'I get a little mad and leave it for later']],
    'sentir': ['How do you feel?', 'When something new goes wrong the first time, you feel...',
      ['Calm, I try again', 'A bit sad, but I keep going', 'Frustrated, I’d rather get help']]
  };
  window.EQ_PREGUNTAS.forEach((p) => {
    const t = EN[p.id];
    if (!t) return;
    p.titulo = t[0]; p.texto = t[1];
    p.opciones.forEach((o, i) => { if (t[2][i]) o.t = t[2][i]; });
  });
}

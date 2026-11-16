# 🚀 Mission Equilibria

**An educational browser game for children aged 7-12. Players run an outpost on the Moon, and later on Mars, and learn that every decision has a cost.**

Mission Equilibria is a submission to the **NASA Hackathon in Medellín, Colombia (November 2026)** for the challenge *Lunar or Martian Outpost Simulator*.

---

## Contents

1. [Understanding Mission Equilibria](#1-understanding-mission-equilibria)
2. [Exploring the game structure](#2-exploring-the-game-structure)
3. [Tracing the NASA data sources](#3-tracing-the-nasa-data-sources)
4. [Reviewing the pedagogical foundations](#4-reviewing-the-pedagogical-foundations)
5. [Scaling the project](#5-scaling-the-project)
6. [Academic references](#6-academic-references)
7. [Course materials used in the design](#7-course-materials-used-in-the-design)
8. [Protecting children's privacy and data](#8-protecting-childrens-privacy-and-data)
9. [Credits and data licensing](#9-credits-and-data-licensing)

---

## 1. Understanding Mission Equilibria

Space content for children tends toward one of two extremes. It either simplifies engineering decisions so much that it teaches nothing real, or it becomes so technical that children lose interest. Mission Equilibria targets the middle ground: **game mechanics, not just graphics, that model real constraints** of survival beyond Earth.

The player is an **astronaut** at the **Astronaut Academy**. The player is alone on the lunar base with **LUNIA**, the base's artificial intelligence. LUNIA is emotional and fragile, and she fears shutting down and being left alone. Each mission is a **simulation** that prepares the base for a future crew. The crew members that appear in the game are simulated, and the game tells the player so from the start. **Commander Ríos** guides the player's training.

As the player completes missions, LUNIA changes color, facial expression, and mood, and the soundtrack shifts with her from melancholic to energetic. This is a hidden narrative side quest: when the player takes care of the base, the player takes care of LUNIA.

### Design principles

- **Every decision has a cost.** The game has no free, "safe" option.
- **Real data, cited in the game.** The game never presents archived data as live data.
- **Few resources at a time.** Each mission uses two or three resources so that a 7-year-old isn't overloaded.
- **Failure without punishment.** Players can retry as many times as they want.
- **No competition between children.** Each player measures progress against their own previous results.
- **Low barrier to entry.** The game runs in a web browser and requires no download or account.

---

## 2. Exploring the game structure

```
Player-type test + avatar creation
                │
                ▼
LUNIA intro cutscene (3 screens)
                │
                ▼
PROLOGUE · Launch: fire the engine inside the launch window to reach the Moon
                │
                ▼
LUNAR BASE · 5 missions at the same level (the player chooses the order)
   ├── Life support (oxygen and water)
   ├── Radiation shielding
   ├── Power budget
   ├── Food production
   └── Communication delay
                │  (after the player completes all 5)
                ▼
MARS · part two; the player travels there by rocket
```

- **Shared components.** Every mission uses resource bars, a progress bar, and a personal score. Each mission has its own mechanic.
- **Adaptivity.** The game adjusts difficulty, hints, and personalization (avatar, colors, and setting) to the player's profile and in-mission performance.
- **Hackathon demo scope.** The demo includes the player-type test, avatars, the LUNIA cutscene, the launch prologue, and Mission 1. The other missions and Mars appear as locked or in design.

---

## 3. Tracing the NASA data sources

> **Note on data integrity:** The prototype uses a **curated, embedded dataset** built from the sources in this section, and every screen cites its source. When the game shows archived data, the game labels it, for example "real data from 2013." Live API integration is part of the roadmap. For details, see [Scaling the project](#5-scaling-the-project).

### 3.1 APIs and data repositories

| Source | Description | Use in Mission Equilibria | Link |
|---|---|---|---|
| ***Space Weather Database Of Notifications, Knowledge, Information*** (***DONKI***), CCMC, NASA Goddard Space Flight Center | Catalog of space weather events: solar flares (FLR), coronal mass ejections (CME), solar energetic particle events (SEP), geomagnetic storms (GST), and notifications. Provides a web service API. | **Radiation shielding.** Solar storm alerts in the game are based on real DONKI events. The player decides whether to reinforce shielding at the expense of power. | Portal: https://ccmc.gsfc.nasa.gov/tools/DONKI · API through the NASA Open APIs portal: https://api.nasa.gov |
| ***Open Science Data Repository*** (***OSDR***), NASA Ames Research Center | Open repository of space biology, biomedical data, and environmental telemetry. Integrates GeneLab and the Ames Life Sciences Data Archive (ALSDA). | Real findings about astronaut health and space biology for the in-game "Did you know?" cards and for decision outcomes. | https://osdr.nasa.gov |
| **RadLab** (an OSDR component) | Database and visualizations of **radiation dosimetry** from multiple instruments and spacecraft. | Reference values for real radiation doses in the shielding mission. | https://visualization.osdr.nasa.gov |
| **NASA Open APIs portal** | Single access point, with a free API key, to DONKI and other public NASA APIs. | Entry point for the planned live integration. | https://api.nasa.gov |
| **NASA Image and Video Library** | NASA public-domain images and video. | Real backgrounds and photos of the Moon and Mars. | https://images.nasa.gov |

> **Important:** On September 30, 2026, the CCMC moved the DONKI web application and API from `kauai.ccmc.gsfc.nasa.gov` to `ccmc.gsfc.nasa.gov`. Paths after `/DONKI/` are unchanged. Use the new host in any integration.

### 3.2 Official documentation and scientific data by mission

| Game mission | Real constraint the mission teaches | Official or scientific source |
|---|---|---|
| **Prologue: Launch** | A rocket can't launch at any time. It must lift off inside a **launch window**, and the upper stage must fire at the exact point for **trans-lunar injection (TLI)**. Otherwise, the spacecraft misses the Moon. | NASA Artemis blog and press materials for Artemis I: a two-hour launch window on November 16, 2022, liftoff at 1:47 AM EST, and TLI about 90 minutes later (https://blogs.nasa.gov/artemis). NASA Technical Reports Server (NTRS), *Artemis I* (IAC 2023): https://ntrs.nasa.gov/citations/20230012789 |
| **Life support** | Oxygen comes from **water electrolysis, which uses electricity**, so power you save today can cost you oxygen tomorrow. Water is recycled, but never at 100%. | NASA Marshall Space Flight Center, International Space Station *Environmental Control and Life Support System* (*ECLSS*) fact sheet. ECLSS includes water recovery, air revitalization, and oxygen generation, and recovers about 98% of the water on the station: https://www.nasa.gov · NASA, *NASA Achieves Water Recovery Milestone on International Space Station* (2023): https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station |
| **Radiation shielding** | Beyond Earth, no magnetic field or thick atmosphere protects you, and solar storms raise the radiation dose suddenly. | DONKI (solar events). LRO/CRaTER: Mazur et al. (2011), *New measurements of total ionizing dose in the lunar environment*, Space Weather, 9, S07002, https://doi.org/10.1029/2010SW000641 · Spence et al. (2010), *CRaTER*, Space Science Reviews, 150, 243-284, https://doi.org/10.1007/s11214-009-9584-8 |
| **Power budget** | A **lunar night lasts about 14 Earth days**. Solar panels produce nothing during that time, so the base must plan for energy storage or alternative sources. | NASA Glenn Research Center, *Fission Surface Power Project* (continuous power for the Moon and Mars that doesn't depend on sunlight): https://www.nasa.gov |
| **Food production** | Growing food in space requires LED light (power), water, and time, and crops don't always succeed. | NASA, *Veggie* system on the International Space Station (first crop in 2014; the crew ate lettuce from it in 2015): https://www.nasa.gov/mission_pages/station/research/news/veggie · NTRS, *Veggie: Space Vegetables for the International Space Station and Beyond*: https://ntrs.nasa.gov/citations/20160004060 |
| **Communication delay** | Signals travel at the speed of light: about **1.3 seconds** one way to the Moon and **about 3-22 minutes** one way to Mars. On Mars, no one on Earth can help you in real time. | NASA *Space Communications and Navigation* (*SCaN*): https://www.nasa.gov/communicating-with-missions |
| **Mars (part two)** | The radiation dose on the Martian surface is lower than during the journey, but it's still high. | Curiosity/RAD: Hassler et al. (2014), *Mars' Surface Radiation Environment Measured with the Mars Science Laboratory's Curiosity Rover*, Science, 343(6169), https://doi.org/10.1126/science.1244797 (average of about 0.67 mSv per day on the surface, compared with about 1.8 mSv per day during the cruise) |

### 3.3 Program context

- **NASA Artemis program.** Narrative context for the lunar base and the later step to Mars: https://www.nasa.gov/artemis
- **NASA Moon to Mars architecture.** Lessons from the International Space Station for exploration, including ECLSS, autonomy, and oxygen recovery. NTRS, *Exploration Lessons from ISS* (2023): https://ntrs.nasa.gov/citations/20230015330

---

## 4. Reviewing the pedagogical foundations

### 4.1 Using game-based learning, not only gamification

Mission Equilibria uses **game-based learning (GBL)**: the content *is* the mechanic. The project follows the distinction by Deterding et al. (2011) between gamification, which adds game elements to a non-game context, and the design of a complete game. A game is a **simplified model of reality** where players experiment without risk (Gee, 2003; Plass, Homer, and Kinzer, 2015). For this reason, players *experience* the launch window, electrolysis, and the lunar night instead of reading about them.

The design uses the **Mechanics-Dynamics-Aesthetics** (**MDA**) framework (Hunicke, LeBlanc, and Zubek, 2004) and the components-mechanics-dynamics hierarchy by Werbach and Hunter (2012). Meta-analyses report moderate positive effects of game-based learning and gamification on cognitive, motivational, and behavioral learning outcomes (Clark et al., 2016; Sailer and Homner, 2020; Li, Ma, and Shi, 2023).

### 4.2 Supporting intrinsic motivation: autonomy, competence, and relatedness

The design applies **self-determination theory** (Ryan and Deci, 2000, 2020) and its application to video games (Rigby and Ryan, 2011):

| Need | How the game supports it |
|---|---|
| **Autonomy** | The player chooses which mission to start with; all five missions are at the same level. The player customizes their avatar. |
| **Competence** | Adaptive difficulty, unlimited retries, and immediate feedback. The score compares players only with their own progress. |
| **Relatedness** | The bond with LUNIA: the player cares for someone who needs help and sees the effect of their effort. |

The design prevents external rewards from replacing a child's own interest, known as the undermining effect (Murayama et al., 2010). Rewards are informational, telling players how they're doing, rather than controlling.

### 4.3 Calibrating challenge: flow, the zone of proximal development, and scaffolding

The game targets the balance between challenge and skill that produces **flow** (Csikszentmihalyi, 1990; Hamari et al., 2016). In pedagogical terms, each mission sits within the **zone of proximal development** (Vygotsky, 1978). The game provides **scaffolding** and removes it as the player gains mastery (Wood, Bruner, and Ross, 1976). LUNIA's and Commander Ríos's dialogue acts as the tutor.

The design fits the **concrete operational stage** (Piaget, 1972) of children aged 7-12: resources appear as visible bars, causes have immediate effects, and the game explains scientific terms in context and in a few words.

### 4.4 Applying adaptive learning

Adaptivity responds to Bloom's **2 sigma problem** (1984): one-to-one tutoring produces much more learning than group instruction. Adaptive systems approach that effect (VanLehn, 2011).

The project applies the taxonomy by Plass and Pawar (2020): **what** the game adapts (difficulty, hints, pace, and aesthetics), **to what** (performance, player type, and emotional state), and **how**. Assessment is **stealth assessment** (Shute and Ventura, 2013): the game infers mastery from what the child does, without tests. The evidence model follows evidence-centered design (Mislevy, Steinberg, and Almond, 2003), and mastery estimation can evolve toward *knowledge tracing* (Corbett and Anderson, 1995). Reviews of adaptive educational games support this approach (Chiotaki et al., 2023; Ninaus and Nebel, 2021).

### 4.5 Using player types without the learning-styles myth

The initial test classifies players with empirically validated models: **Hexad** (Marczewski, 2015; Tondello et al., 2016, 2019), including versions validated in Spanish and with adolescents (Manzano-León et al., 2020; Prieto-Andreu and Moreno-Ger, 2024), along with classic references such as Bartle (1996) and BrainHex (Nacke et al., 2014). Research documents the use of tailored gamification based on player profiles (Klock et al., 2020; Oliveira et al., 2023).

> **Caution:** The player profile determines *how the game presents* the experience: aesthetic personalization, challenge type, and tone. The profile **doesn't** restrict content according to a supposed "learning style." The hypothesis that matching instruction to learning styles improves learning lacks solid empirical support (Pashler et al., 2008; Clinton-Lisell and Litzinger, 2024; Howard-Jones, 2014). Every player learns the same science.

### 4.6 Designing for emotion, curiosity, and the brain

- **Achievement emotions.** According to control-value theory (Pekrun, 2006, 2024), children learn better when they feel in control of a task and value it. For this reason, failure carries no punishment and LUNIA gives each mission a purpose.
- **Curiosity.** Curiosity activates the dopaminergic circuit and improves memory (Gruber, Gelman, and Ranganath, 2014; Gruber and Ranganath, 2019). "Did you know?" cards and unexpected solar events feed curiosity.
- **Prediction error and uncertainty.** Dopamine responds to the unexpected (Schultz, Dayan, and Montague, 1997), and well-calibrated uncertainty increases engagement with learning games (Howard-Jones and Demetriou, 2009). Events that change in every play session provide **replayability**.
- **Emotion and learning are inseparable** (Immordino-Yang and Damasio, 2007; Mora, 2013; Dehaene, 2019). LUNIA's emotional narrative isn't decoration; it's part of the learning strategy.

### 4.7 Managing cognitive load and accessibility

Following cognitive load theory (Sweller, van Merriënboer, and Paas, 2019), each mission uses **two or three resources at a time**, as the challenge brief recommends. Scaffolding decreases with experience to avoid the expertise reversal effect (Kalyuga, 2007). The design follows the **Universal Design for Learning** (**UDL**) guidelines (CAST, 2024): multiple means of representation (short text, icons, audio, and color), action, and engagement.

### 4.8 Iterating with real users

The team tested the prototype with 10-year-old children. The children liked the opening narrative, but it had too much text and too many clicks, so the team cut it to three screens. This cycle of testing, feedback, and adjustment follows the principles of iterative prototyping for gamified projects (Salen and Zimmerman, 2004, as cited in the course materials).

---

## 5. Scaling the project

### 5.1 Scaling the technology

- **Modular architecture.** Each mission is an independent module (HTML, CSS, and JavaScript) that uses the same components: resource bars, progress, and score. You can add a mission without rewriting the others.
- **Separate data layer.** Scientific data lives in JSON files that record each value's source and date. You can update a value without changing game code.
- **From curated data to live data.** The next step connects to DONKI in real time, through `api.nasa.gov` or the new CCMC host, so that solar storms in the game reflect the actual space weather of the day. If the API fails, the game falls back to the curated dataset and says so on screen.
- **No server and no accounts.** The game runs as a static site, for example on GitHub Pages, so any school with a web browser can use it.
- **Evolving adaptive engine.** The engine starts with simple evidence-based rules and can move to probabilistic mastery models, such as Bayesian knowledge tracing, once enough usage data exists.

### 5.2 Scaling the content

- **Phase 2: Mars.** Missions with real Martian conditions: Curiosity/RAD radiation data, communication delays measured in minutes, dust storms, and less sunlight.
- **New destinations.** The same engine supports other outposts, such as an orbital station or a base on a moon of Jupiter, as the challenge brief allows.
- **More NASA sources.** The project can add new OSDR and RadLab datasets as NASA publishes them.

### 5.3 Scaling the pedagogy

- **Classroom mode.** A teacher dashboard that shows group progress, teaching guides, and alignment with the natural science standards in the Colombian curriculum.
- **Learning situations.** Each mission can become a teaching sequence of exercise, activity, and complex task, linked to the Sustainable Development Goals (SDGs) for energy, water, and food.
- **Wider audiences.** Older siblings, families, museums, and planetariums, with optional levels of depth.
- **Languages and accessibility.** Text stored separately from code so that you can translate it (English and Indigenous languages of Colombia), plus subtitles, high-contrast mode, and text-to-speech.

### 5.4 Evaluating and researching

- Pre- and post-test studies that measure how well players understand trade-offs between resources.
- Anonymous, aggregated learning analytics to rebalance missions.
- Validation of the player-profile test with Colombian children. As a reference, see Robles-Haydar et al. (2022), which validates the BFQ-C with Colombian adolescents.

---

## 6. Academic references

Key: **[OA]** open access · **[Book]** book · **[Sub]** subscription journal · **[Law]** legal standard.

### 6.1 Design cautions (learning styles and neuromyths)
- [Sub] Pashler, H., McDaniel, M., Rohrer, D., & Bjork, R. (2008). Learning styles: Concepts and evidence. *Psychological Science in the Public Interest, 9*(3), 105-119. https://doi.org/10.1111/j.1539-6053.2009.01038.x
- [OA] Clinton-Lisell, V., & Litzinger, C. (2024). Is it really a neuromyth? A meta-analysis of the learning styles matching hypothesis. *Frontiers in Psychology, 15*, 1428732. https://doi.org/10.3389/fpsyg.2024.1428732
- [OA] Brown, A. (2023). The persistence of matching teaching and learning styles. *Frontiers in Education, 8*, 1147498. https://doi.org/10.3389/feduc.2023.1147498
- [Sub] Howard-Jones, P. A. (2014). Neuroscience and education: Myths and messages. *Nature Reviews Neuroscience, 15*, 817-824. https://doi.org/10.1038/nrn3817

### 6.2 Adaptive learning
- [Sub] Bloom, B. S. (1984). The 2 sigma problem. *Educational Researcher, 13*(6), 4-16. https://doi.org/10.3102/0013189X013006004
- [Sub] Corbett, A. T., & Anderson, J. R. (1995). Knowledge tracing. *User Modeling and User-Adapted Interaction, 4*, 253-278. https://doi.org/10.1007/BF01099821
- [Sub] VanLehn, K. (2011). The relative effectiveness of human tutoring, intelligent tutoring systems, and other tutoring systems. *Educational Psychologist, 46*(4), 197-221. https://doi.org/10.1080/00461520.2011.611369
- [Sub] Vandewaetere, M., Desmet, P., & Clarebout, G. (2011). The contribution of learner characteristics in the development of computer-based adaptive learning environments. *Computers in Human Behavior, 27*(1), 118-130.
- [Sub] Plass, J. L., & Pawar, S. (2020). Toward a taxonomy of adaptivity for learning. *Journal of Research on Technology in Education, 52*(3), 275-300. https://doi.org/10.1080/15391523.2020.1719943
- [Book] Aleven, V., McLaughlin, E. A., Glenn, R. A., & Koedinger, K. R. (2016). Instruction based on adaptive learning technologies. In R. E. Mayer & P. A. Alexander (Eds.), *Handbook of research on learning and instruction* (2nd ed.). Routledge.
- [OA] Chiotaki, D., Poulopoulos, V., & Karpouzis, K. (2023). Adaptive game-based learning in education: A systematic review. *Frontiers in Computer Science, 5*, 1062350. https://doi.org/10.3389/fcomp.2023.1062350
- [OA] Ninaus, M., & Nebel, S. (2021). A systematic literature review of analytics for adaptivity within educational video games. *Frontiers in Education, 5*, 611072. https://doi.org/10.3389/feduc.2020.611072
- [OA] Shute, V. J., & Ventura, M. (2013). *Stealth assessment: Measuring and supporting learning in video games*. MIT Press.
- [Sub] Mislevy, R. J., Steinberg, L. S., & Almond, R. G. (2003). On the structure of educational assessments. *Measurement, 1*(1), 3-62.
- [OA] Shute, V. J., & Rahimi, S. (2022). *Stealth assessment*. CIRCL Rapid Community Report. https://myweb.fsu.edu/vshute/pdf/SA_Primer.pdf

### 6.3 Learning psychology, motivation, and emotion
- [Book] Piaget, J. (1972). *Psicología del niño* [The psychology of the child]. Morata.
- [Book] Vygotsky, L. S. (1978). *Mind in society*. Harvard University Press.
- [Sub] Wood, D., Bruner, J. S., & Ross, G. (1976). The role of tutoring in problem solving. *Journal of Child Psychology and Psychiatry, 17*(2), 89-100.
- [Sub] Ryan, R. M., & Deci, E. L. (2000). Self-determination theory and the facilitation of intrinsic motivation. *American Psychologist, 55*(1), 68-78. https://doi.org/10.1037/0003-066X.55.1.68
- [Sub] Ryan, R. M., & Deci, E. L. (2020). Intrinsic and extrinsic motivation from a self-determination theory perspective. *Contemporary Educational Psychology, 61*, 101860. https://doi.org/10.1016/j.cedpsych.2020.101860
- [Book] Rigby, S., & Ryan, R. M. (2011). *Glued to games*. Praeger.
- [Sub] Malone, T. W. (1981). Toward a theory of intrinsically motivating instruction. *Cognitive Science, 5*(4), 333-369. https://doi.org/10.1207/s15516709cog0504_2
- [Book] Csikszentmihalyi, M. (1990). *Flow: The psychology of optimal experience*. Harper & Row.
- [Sub] Hamari, J., et al. (2016). Challenging games help students learn. *Computers in Human Behavior, 54*, 170-179. https://doi.org/10.1016/j.chb.2015.07.045
- [Sub] Pekrun, R. (2006). The control-value theory of achievement emotions. *Educational Psychology Review, 18*, 315-341. https://doi.org/10.1007/s10648-006-9029-9
- [Sub] Pekrun, R. (2024). Control-value theory: From achievement emotion to a general theory of human emotions. *Educational Psychology Review, 36*.
- [OA] Putwain, D. W., Schmitz, E. A., Wood, P., & Pekrun, R. (2021). The role of achievement emotions in primary school mathematics. *British Journal of Educational Psychology, 91*(1), 347-367.
- [Sub] D'Mello, S., & Graesser, A. (2012). Dynamics of affective states during complex learning. *Learning and Instruction, 22*(2), 145-157.
- [OA] Muñoz, K., Noguez, J., Neri, L., Mc Kevitt, P., & Lunney, T. (2016). A computational model of learners' achievement emotions using control-value theory. *Educational Technology & Society, 19*(2), 42-56.
- [OA] Sweller, J., van Merriënboer, J. J. G., & Paas, F. (2019). Cognitive architecture and instructional design: 20 years later. *Educational Psychology Review, 31*, 261-292. https://doi.org/10.1007/s10648-019-09465-5
- [Sub] Kalyuga, S. (2007). Expertise reversal effect and its implications for learner-tailored instruction. *Educational Psychology Review, 19*, 509-539. https://doi.org/10.1007/s10648-007-9054-3
- [OA] CAST. (2024). *Universal Design for Learning Guidelines 3.0*. https://udlguidelines.cast.org

### 6.4 Neuroscience
- [Sub] Schultz, W., Dayan, P., & Montague, P. R. (1997). A neural substrate of prediction and reward. *Science, 275*(5306), 1593-1599. https://doi.org/10.1126/science.275.5306.1593
- [OA] Gruber, M. J., Gelman, B. D., & Ranganath, C. (2014). States of curiosity modulate hippocampus-dependent learning via the dopaminergic circuit. *Neuron, 84*(2), 486-496. https://doi.org/10.1016/j.neuron.2014.08.060
- [OA] Gruber, M. J., & Ranganath, C. (2019). How curiosity enhances hippocampus-dependent memory: The PACE framework. *Trends in Cognitive Sciences, 23*(12), 1014-1025. https://doi.org/10.1016/j.tics.2019.10.003
- [OA] Gruber, M. J., & Fandakova, Y. (2021). Curiosity in childhood and adolescence. *Current Opinion in Behavioral Sciences, 39*.
- [OA] Murayama, K., Matsumoto, M., Izuma, K., & Matsumoto, K. (2010). Neural basis of the undermining effect of monetary reward on intrinsic motivation. *PNAS, 107*(49), 20911-20916. https://doi.org/10.1073/pnas.1013305107
- [Sub] Howard-Jones, P., & Demetriou, S. (2009). Uncertainty and engagement with learning games. *Instructional Science, 37*(6), 519-536.
- [Sub] Immordino-Yang, M. H., & Damasio, A. (2007). We feel, therefore we learn. *Mind, Brain, and Education, 1*(1), 3-10. https://doi.org/10.1111/j.1751-228X.2007.00004.x
- [Book] Dehaene, S. (2019). *¿Cómo aprendemos?* [How we learn]. Siglo XXI.
- [Book] Mora, F. (2013). *Neuroeducación: solo se puede aprender aquello que se ama* [Neuroeducation: You can only learn what you love]. Alianza.
- [Sub] Green, C. S., & Bavelier, D. (2019). Enhancing attentional control: Lessons from action video games. *Neuron, 104*(1), 147-163.
- [Sub] Wise, R. A. (2004). Dopamine, learning and motivation. *Nature Reviews Neuroscience, 5*(6), 483-494. https://doi.org/10.1038/nrn1406

### 6.5 Player types and typologies
- [OA] Bartle, R. (1996). *Hearts, clubs, diamonds, spades: Players who suit MUDs*. https://mud.co.uk/richard/hcds.htm
- [Book] Marczewski, A. (2015). *Even Ninja Monkeys Like to Play*. Gamified UK. Hexad model summary: https://hexad.gamified.uk
- [Sub] Nacke, L. E., Bateman, C., & Mandryk, R. L. (2014). BrainHex: A neurobiological gamer typology survey. *Entertainment Computing, 5*(1), 55-62. https://doi.org/10.1016/j.entcom.2013.06.002
- [Sub] Tondello, G. F., et al. (2016). The gamification user types Hexad scale. *CHI PLAY '16*. https://doi.org/10.1145/2967934.2968082
- [Sub] Tondello, G. F., Mora, A., Marczewski, A., & Nacke, L. E. (2019). Empirical validation of the gamification user types Hexad scale in English and Spanish. *International Journal of Human-Computer Studies, 127*, 95-111. https://doi.org/10.1016/j.ijhcs.2018.10.002
- [Sub] Krath, J., Altmeyer, M., Tondello, G. F., & Nacke, L. E. (2023). Hexad-12. *CHI '23*.
- [OA] Manzano-León, A., et al. (2020). Adaptation and validation of the scale of types of users in gamification with the Spanish adolescent population. *International Journal of Environmental Research and Public Health, 17*(11), 4157. https://doi.org/10.3390/ijerph17114157
- [OA] Ooge, J., De Croon, R., Verbert, K., & Vanden Abeele, V. (2020). Tailoring gamification for adolescents. *CHI PLAY '20*. https://doi.org/10.1145/3410404.3414267
- [OA] Psychometric investigation of the gamification Hexad user types scale with Brazilian Portuguese adolescents speakers. (2023). *Scientific Reports, 13*, 18645. https://doi.org/10.1038/s41598-023-45544-y
- [OA] Prieto-Andreu, J.-M., & Moreno-Ger, P. (2024). Jugar correctamente: validación empírica de la escala Gamertype [Playing correctly: Empirical validation of the Gamertype scale]. *Revista Española de Pedagogía, 82*(288), 243-270. https://doi.org/10.22550/2174-0909.4056
- [Sub] Xiao, Y., Chen, X., Jin, Y., & Hew, K. F. (2024). Player types in gamified learning: Conceptualization, validation, and profiling. *International Journal of Human-Computer Interaction*. https://doi.org/10.1080/10447318.2024.2338664
- [Sub] Barbaranelli, C., Caprara, G. V., Rabasca, A., & Pastorelli, C. (2003). A questionnaire for measuring the Big Five in late childhood. *Personality and Individual Differences, 34*(4), 645-664. https://doi.org/10.1016/S0191-8869(02)00051-X
- [OA] Robles-Haydar, C. A., Amar-Amar, J., & Martínez-González, M. B. (2022). Validación del BFQ-C, versión corta, en adolescentes colombianos [Validation of the short version of the BFQ-C in Colombian adolescents]. *Salud Mental, 45*(1), 29-34. https://doi.org/10.17711/SM.0185-3325.2022.005
- [OA] Klock, A. C. T., Gasparini, I., Pimenta, M. S., & Hamari, J. (2020). Tailored gamification: A review of literature. *International Journal of Human-Computer Studies, 144*, 102495. https://doi.org/10.1016/j.ijhcs.2020.102495
- [Sub] Hallifax, S., Serna, A., Marty, J.-C., & Lavoué, É. (2019). Adaptive gamification in education: A literature review of current trends and developments. *EC-TEL 2019*, 294-307.
- [OA] Oliveira, W., et al. (2023). Tailored gamification in education: A literature review and future agenda. *Education and Information Technologies, 28*, 373-406. https://doi.org/10.1007/s10639-022-11122-4

### 6.6 Gamification and game-based learning
- [Sub] Deterding, S., Dixon, D., Khaled, R., & Nacke, L. (2011). From game design elements to gamefulness: Defining "gamification." *MindTrek '11*, 9-15. https://doi.org/10.1145/2181037.2181040
- [OA] Hunicke, R., LeBlanc, M., & Zubek, R. (2004). MDA: A formal approach to game design and game research.
- [Book] Werbach, K., & Hunter, D. (2012). *For the win*. Wharton Digital Press.
- [Book] Gee, J. P. (2003). *What video games have to teach us about learning and literacy*. Palgrave Macmillan.
- [Book] Salen, K., & Zimmerman, E. (2004). *Rules of play: Game design fundamentals*. MIT Press.
- [Sub] Plass, J. L., Homer, B. D., & Kinzer, C. K. (2015). Foundations of game-based learning. *Educational Psychologist, 50*(4), 258-283. https://doi.org/10.1080/00461520.2015.1122533
- [OA] Clark, D. B., Tanner-Smith, E. E., & Killingsworth, S. S. (2016). Digital games, design, and learning. *Review of Educational Research, 86*(1), 79-122. https://doi.org/10.3102/0034654315582065
- [OA] Sailer, M., & Homner, L. (2020). The gamification of learning: A meta-analysis. *Educational Psychology Review, 32*, 77-112. https://doi.org/10.1007/s10648-019-09498-w
- [OA] Li, M., Ma, S., & Shi, Y. (2023). Examining the effectiveness of gamification as a tool promoting teaching and learning in educational settings. *Frontiers in Psychology, 14*, 1253549. https://doi.org/10.3389/fpsyg.2023.1253549
- [Sub] Li, L., Hew, K. F., & Du, J. (2024). Gamification enhances student intrinsic motivation, perceptions of autonomy and relatedness, but minimal impact on competency. *Educational Technology Research and Development*.
- [OA] Treve, M. (2026). Gamification in asynchronous online learning: A meta-analysis. *Online Learning, 30*(3), 210-237. https://doi.org/10.24059/olj.v30i3.5188

---

## 7. Course materials used in the design

The instructional and game design draws on course notes from the **Universidad Internacional de La Rioja (UNIR)**. These materials are for internal course use, and this repository doesn't redistribute them. Original Spanish titles appear with an English translation.

**Aprendizaje Basado en el Juego (ABJ) para la Mejora del Proceso Educativo** (Game-Based Learning to Improve the Educational Process)
- Tema 1. Yo soy *game designer* (Unit 1. I am a game designer)
- Tema 2. El eterno equilibrio entre aprendizaje y diversión (Unit 2. The eternal balance between learning and fun)
- Tema 3. La secuencia de ABJ (Unit 3. The game-based learning sequence)
- Tema 8. ¿Merece la pena un proyecto ABJ? (Unit 8. Is a game-based learning project worth it?)

**Juego y Aprendizaje en el Ser Humano: Avances y Nuevos Modelos** (Play and Human Learning: Advances and New Models)
- Tema 1. Origen y evolución del concepto de juego (Unit 1. Origin and evolution of the concept of play)
- Tema 2. Teorías del juego aplicadas al aprendizaje (Unit 2. Theories of play applied to learning)
- Tema 3. Fundamentos de la gamificación en educación (Unit 3. Foundations of gamification in education)
- Tema 4. Teorías de la motivación intrínseca (Unit 4. Theories of intrinsic motivation: self-determination theory and the RAMP model)
- Tema 5. Neurociencia del juego y aprendizaje (Unit 5. Neuroscience of play and learning)
- Tema 6. Impacto de la gamificación en el proceso de enseñanza-aprendizaje (Unit 6. Impact of gamification on teaching and learning)
- Tema 7. Teorías y modelos de diseño en experiencias lúdicas para el aula (Unit 7. Design theories and models for classroom play experiences)
- Tema 8. Modelos emergentes de gamificación (Unit 8. Emerging gamification models)

**Diseño de Proyectos Gamificados I** (Designing Gamified Projects I)
- Tema 1. Contexto y objetivos en la gamificación educativa (Unit 1. Context and goals in educational gamification)
- Tema 2. Trazando rutas para un aprendizaje transformador (Unit 2. Mapping paths to transformative learning)
- Tema 3. Componentes y elementos de juego (Unit 3. Game components and elements)
- Tema 4. Dinámicas de juego (Unit 4. Game dynamics: attracting and sustaining motivation)
- Tema 5. Mecánicas de juego I (Unit 5. Game mechanics I: interacting with the gamified experience)
- Tema 6. Mecánicas de juego II (Unit 6. Game mechanics II: basic mechanics)
- Tema 7. Integración de elementos narrativos y estéticos con dinámicas y mecánicas (Unit 7. Integrating narrative and aesthetic elements with dynamics and mechanics)
- Tema 8. Prototipado de proyectos gamificados (Unit 8. Prototyping gamified projects)

**Metodologías Activas y Gamificación** (Active Methodologies and Gamification)
- Tema 7. Situaciones de aprendizaje como misiones gamificadas (Unit 7. Learning situations as gamified missions)
- Tema 8. Proyecto integrador a través de un caso gamificado de éxito (Unit 8. Capstone project based on a successful gamified case)

---

## 8. Protecting children's privacy and data

- **Data minimization.** The game stores the profile test and progress in the player's own browser. It doesn't ask for real names, email addresses, or accounts.
- **Colombian legal framework.**
  - [Law] Ley 1581 de 2012 (Personal Data Protection Act), Article 7, on data of children and adolescents.
  - [Law] Decreto 1377 de 2013 (Decree 1377 of 2013), Article 12.
  - [Law] Ley 1098 de 2006 (Code of Childhood and Adolescence).
- **International reference.** UNICEF. (2021). *Policy guidance on AI for children* (Version 2.0).
- **No social comparison.** The game has no public leaderboards between children.
- **Emotional well-being.** LUNIA's fragility invites care and never blames the player. Failing a mission doesn't shut LUNIA down; it only delays her improvement.

---

## 9. Credits and data licensing

- NASA data, images, and documents are generally in the public domain in the United States. Use of the NASA logo and insignia is restricted. NASA doesn't sponsor or endorse this project.
- Every scientific value in the game appears on screen with its source and date.
- Some references (books and legal standards) come from secondary sources. Verify page numbers and DOIs before any academic publication.

**Mission Equilibria team · NASA Hackathon Medellín 2026**

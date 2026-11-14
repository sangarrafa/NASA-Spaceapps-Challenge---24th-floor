// Based on Bartle's player types (1996). "Killer" is reframed as "Challenger"
// and aimed at the planet/mission, not at other kids, per the design doc's
// own warning that head-to-head competition can discourage collaboration
// in a classroom setting.
export const ARCHETYPES = {
  achiever: {
    id: 'achiever',
    title: 'Achiever',
    icon: '🏆',
    color: '#ffcc33',
    tagline: 'Goal crusher',
    description:
      "You love setting goals and checking them off. Progress bars, badges, and finished checklists are what keep you going.",
  },
  explorer: {
    id: 'explorer',
    title: 'Explorer',
    icon: '🔭',
    color: '#33c6ff',
    tagline: 'Secret finder',
    description:
      "You love figuring out how things work and poking at the edges. Hidden data and 'what happens if...' questions are your favorite part.",
  },
  socializer: {
    id: 'socializer',
    title: 'Socializer',
    icon: '🤝',
    color: '#7cf29c',
    tagline: 'Crew builder',
    description:
      "You care most about your crew. Teamwork, sharing discoveries, and making sure everyone's okay is what makes a mission feel good.",
  },
  challenger: {
    id: 'challenger',
    title: 'Challenger',
    icon: '⚡',
    color: '#ff6b6b',
    tagline: 'Record breaker',
    description:
      "You love a good fight — against the clock, against your own best record, against the planet itself. The outpost is your arena.",
  },
};

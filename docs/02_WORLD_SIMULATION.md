# World Simulation

## Simulation scope

The game does not attempt to simulate every person on the map at full fidelity. Instead it uses layered abstraction.

## World layers

1. **Map geometry** - roads, buildings, districts, landmarks.
2. **District state** - wealth, crime, corruption, police presence, surveillance, business activity.
3. **Organization layer** - gangs, mafias, businesses, alliances, rivalries.
4. **Character layer** - key NPCs, leaders, officers, entrepreneurs, heirs.
5. **Player layer** - the active organization led by the player character.

## District parameters

Each district should have generated values such as:
- wealth
- poverty
- crime level
- corruption level
- police presence
- surveillance density
- economic activity
- property values
- population profile
- gang presence
- strategic value

## City personality

Cities are not only different in layout. They also have different strategic personalities based on region and local conditions.

Examples:
- some cities are richer but heavily monitored,
- some cities are poorer but easier to corrupt,
- some cities have stronger transport and logistics value,
- some cities are better for drug production or smuggling,
- some cities are more hostile to open street crime.

## Buildings

Buildings exist as map entities and strategic targets.

Buildings do not need full interior simulation.
Each important building can still have hidden gameplay metadata:
- owner
- business type
- value
- security
- usefulness for crime
- usefulness for laundering
- usefulness for logistics
- usefulness for influence

## Time and change

The world should continue to change over time:
- districts can become safer or more dangerous,
- businesses can grow or collapse,
- politicians can rise or fall,
- police pressure can increase or weaken,
- organizations can split, merge, or be eliminated.

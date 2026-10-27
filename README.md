# TENNIS CHAMPIONS 3D

A AAA-quality, highly interactive 3D tennis game running in modern web browsers powered by Three.js, WebGL, Web Audio API, and React with Tailwind CSS.

## Features

### 1. 3D Tennis Stadium & Court Surfaces
- **Lawn Grass (London Grand Slam)**: Fast ball pace, low skidding bounce, pristine alternating lawn mown stripes.
- **Hard Court (New York Open)**: Vibrant blue acrylic surface with true, consistent bounce and crisp lighting.
- **Red Clay (Paris Championship)**: Terracotta brick dust surface with high kick bounce and heavier baselines.
- **Stadium Architecture**: Tiered spectator grandstands with animated crowd, 4 floodlight towers, LED sponsor advertising billboards, umpire high chair, and player benches with towels.

### 2. Articulated 3D Tennis Players & Procedural Animations
- Composite 3D player models with tennis jerseys, shorts, shoes, socks, headbands, and rackets with realistic strung grids.
- Procedural kinematic animation states: Idle bouncing ready stance, dynamic sprint cycle, serve toss and overhead strike, topspin forehand drive, slice backhand, defensive high lob, jump smash/overhead, and victory celebrations.

### 3. Realistic Ball Physics & Aerodynamics
- Gravity, drag, Magnus spin dynamics (topspin pulls ball down sharply; slice floats and skids low).
- Net cord collisions with authentic top cord clip or rebound.
- Court surface friction and restitution differences between Grass, Hard, and Clay.
- Ball ribbon trail, dynamic ground contact shadow, and chalk dust puff impact particles.
- Speed radar gun calculation in km/h.

### 4. Game Modes
- **Quick Match**: Instant action with default settings.
- **Player vs AI**: Customizable exhibition match with Easy, Medium, Hard, and Expert difficulties.
- **Local 2-Player**: Head-to-head 1v1 battle on a single keyboard (WASD vs Arrow keys).
- **Tournament Mode**: 8-Player Grand Slam knockout bracket (Quarter-Finals, Semi-Finals, and Championship Final).
- **Practice Mode**: Bullseye target drill with hit streak counter and service box practice.

### 5. Controls

#### Player 1 (Solo / Near Side)
- **W / A / S / D**: Movement & shot steering
- **Space**: Serve or Hit (Standard Flat Drive)
- **Q**: Forehand (Heavy Topspin Drive)
- **E**: Backhand (Slice / Float)
- **R**: High Defensive Lob
- **F**: Overhead Smash / Spike

#### Player 2 (Local 2-Player)
- **Arrow Keys (↑ / ← / ↓ / →)**: Movement & shot steering
- **Enter**: Serve or Hit (Standard Flat Drive)
- **J**: Forehand (Heavy Topspin Drive)
- **K**: Backhand (Slice / Float)
- **L**: High Defensive Lob
- **Right Shift**: Overhead Smash / Spike

#### Hotkeys
- **P**: Pause / Resume match
- **M**: Mute / Unmute audio
- **C**: Cycle camera angles (Chase, TV Broadcast, Action Zoom, First-Person)
- **H**: Show / Hide Bottom Control Dock

### 6. Official Tennis Scoring Engine
- Love, 15, 30, 40, Deuce, Advantage (Ad-In / Ad-Out), Game, Sets, and Match.
- 7-Point Tiebreak at 6-6.
- Deuce/Ad-court alternating serves and First/Second serve fault tracking.
- Web Audio API procedural sound synthesis (no external MP3 downloads required): racket strings impact, ball bounce on grass/clay/hardcourt, net cord tick, crowd murmur, crowd cheering & applause bursts, and speech synthesis umpire calls ("15 - Love", "Deuce", "Game Player 1").

## Installation and Launch

```bash
# Install dependencies
npm install

# Run the development server
npm run dev

# Build production bundle
npm run build
```

## External Assets & Licenses
- **Three.js**: MIT License
- **Lucide Icons**: MIT License
- **canvas-confetti**: ISC License
- All textures, 3D geometries, materials, and audio effects are 100% procedurally synthesized in code with zero external file dependencies or 404s.

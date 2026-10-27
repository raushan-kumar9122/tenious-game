/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TournamentMatch, PlayerStats } from '../types';
import { TOURNAMENT_ROSTER } from './constants';

export class TournamentManager {
  public matches: TournamentMatch[] = [];
  public currentMatchId: string = 'qf1';
  public isCompleted: boolean = false;
  public tournamentWinner: PlayerStats | null = null;

  constructor() {
    this.initTournament();
  }

  public initTournament() {
    this.isCompleted = false;
    this.tournamentWinner = null;
    const roster = [...TOURNAMENT_ROSTER];
    const userPlayer = roster[0]; // Alex Ryder

    // Quarterfinals
    this.matches = [
      {
        id: 'qf1',
        round: 'quarters',
        player1: userPlayer,
        player2: roster[4], // Dmitri Kozlov
        winnerId: null,
      },
      {
        id: 'qf2',
        round: 'quarters',
        player1: roster[1], // Carlos Soler
        player2: roster[6], // Lars Lindqvist
        winnerId: null,
      },
      {
        id: 'qf3',
        round: 'quarters',
        player1: roster[2], // Nikola Vanev
        player2: roster[7], // Felix Richter
        winnerId: null,
      },
      {
        id: 'qf4',
        round: 'quarters',
        player1: roster[3], // Stefan Maillard
        player2: roster[5], // Matteo Rossi
        winnerId: null,
      },
      // Semifinals
      {
        id: 'sf1',
        round: 'semis',
        player1: userPlayer,
        player2: roster[1],
        winnerId: null,
      },
      {
        id: 'sf2',
        round: 'semis',
        player1: roster[2],
        player2: roster[3],
        winnerId: null,
      },
      // Final
      {
        id: 'fn',
        round: 'final',
        player1: userPlayer,
        player2: roster[2],
        winnerId: null,
      },
    ];

    this.currentMatchId = 'qf1';
  }

  public getCurrentMatch(): TournamentMatch | undefined {
    return this.matches.find((m) => m.id === this.currentMatchId);
  }

  public onUserWonMatch() {
    const cur = this.getCurrentMatch();
    if (!cur) return;

    cur.winnerId = cur.player1.id;
    cur.scoreDisplay = '6-4, 7-5';

    if (cur.round === 'quarters') {
      // Simulate other QFs
      this.simulateMatch('qf2', 0.65);
      this.simulateMatch('qf3', 0.7);
      this.simulateMatch('qf4', 0.6);

      const qf2 = this.matches.find((m) => m.id === 'qf2')!;
      const qf2Winner = qf2.winnerId === qf2.player1.id ? qf2.player1 : qf2.player2;

      const sf1 = this.matches.find((m) => m.id === 'sf1')!;
      sf1.player2 = qf2Winner;

      this.currentMatchId = 'sf1';
    } else if (cur.round === 'semis') {
      this.simulateMatch('sf2', 0.6);
      const sf2 = this.matches.find((m) => m.id === 'sf2')!;
      const sf2Winner = sf2.winnerId === sf2.player1.id ? sf2.player1 : sf2.player2;

      const fn = this.matches.find((m) => m.id === 'fn')!;
      fn.player2 = sf2Winner;

      this.currentMatchId = 'fn';
    } else if (cur.round === 'final') {
      this.isCompleted = true;
      this.tournamentWinner = cur.player1;
    }
  }

  public onUserLostMatch() {
    const cur = this.getCurrentMatch();
    if (!cur) return;
    cur.winnerId = cur.player2.id;
    cur.scoreDisplay = '4-6, 5-7';
    this.isCompleted = true;
    this.tournamentWinner = cur.player2;
  }

  private simulateMatch(matchId: string, probP1: number) {
    const m = this.matches.find((item) => item.id === matchId);
    if (!m) return;
    const p1Wins = Math.random() < probP1;
    m.winnerId = p1Wins ? m.player1.id : m.player2.id;
    const scores = ['6-3, 6-4', '7-6, 6-4', '6-4, 3-6, 6-3', '6-2, 6-3'];
    m.scoreDisplay = scores[Math.floor(Math.random() * scores.length)];
  }
}

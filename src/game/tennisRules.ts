/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MatchScore, MatchStats, CallAnnouncement } from '../types';
import { sound } from './audio';

export class TennisRulesEngine {
  public score: MatchScore;
  public stats: MatchStats;
  public setsToWin: 1 | 2 | 3 = 1;
  public onAnnouncement?: (announcement: CallAnnouncement) => void;

  constructor(setsToWin: 1 | 2 | 3 = 1) {
    this.setsToWin = setsToWin;
    this.score = this.createInitialScore();
    this.stats = this.createInitialStats();
  }

  private createInitialScore(): MatchScore {
    return {
      player1Sets: [0],
      player2Sets: [0],
      currentSet: 0,
      player1Games: 0,
      player2Games: 0,
      player1Points: 0,
      player2Points: 0,
      isTiebreak: false,
      player1TiebreakPoints: 0,
      player2TiebreakPoints: 0,
      server: 1,
      servingSide: 'deuce',
      secondServe: false,
      winner: null,
    };
  }

  private createInitialStats(): MatchStats {
    return {
      acesP1: 0,
      acesP2: 0,
      doubleFaultsP1: 0,
      doubleFaultsP2: 0,
      winnersP1: 0,
      winnersP2: 0,
      unforcedErrorsP1: 0,
      unforcedErrorsP2: 0,
      firstServeInP1: 0,
      firstServeTotalP1: 0,
      firstServeInP2: 0,
      firstServeTotalP2: 0,
      totalPointsP1: 0,
      totalPointsP2: 0,
      maxServeSpeedP1: 0,
      maxServeSpeedP2: 0,
      longestRally: 0,
      currentRally: 0,
    };
  }

  public resetMatch(setsToWin?: 1 | 2 | 3) {
    if (setsToWin) this.setsToWin = setsToWin;
    this.score = this.createInitialScore();
    this.stats = this.createInitialStats();
  }

  private announce(text: string, type: CallAnnouncement['type'], speak: boolean = true) {
    if (this.onAnnouncement) {
      this.onAnnouncement({ text, type, timestamp: Date.now() });
    }
    if (speak) {
      sound.announceScore(text);
    }
  }

  /**
   * Called when server commits a fault on serve
   */
  public handleFault(isAceOrLet: 'fault' | 'let' = 'fault') {
    if (isAceOrLet === 'let') {
      this.announce('Let. First serve', 'let');
      return;
    }

    const server = this.score.server;
    if (server === 1) {
      if (!this.score.secondServe) this.stats.firstServeTotalP1++;
    } else {
      if (!this.score.secondServe) this.stats.firstServeTotalP2++;
    }

    if (!this.score.secondServe) {
      // First fault -> second serve
      this.score.secondServe = true;
      this.announce('Fault. Second serve', 'fault');
    } else {
      // Double fault -> receiver wins point
      if (server === 1) {
        this.stats.doubleFaultsP1++;
      } else {
        this.stats.doubleFaultsP2++;
      }
      this.score.secondServe = false;
      this.announce('Double Fault', 'double_fault');
      const receiver = server === 1 ? 2 : 1;
      this.awardPoint(receiver, 'double_fault');
    }
  }

  /**
   * Award point to player 1 or 2
   */
  public awardPoint(winner: 1 | 2, reason: 'winner' | 'ace' | 'unforced_error' | 'double_fault' = 'winner') {
    if (this.score.winner !== null) return; // Match already finished

    // Update rally and stats
    if (this.stats.currentRally > this.stats.longestRally) {
      this.stats.longestRally = this.stats.currentRally;
    }
    this.stats.currentRally = 0;

    if (winner === 1) {
      this.stats.totalPointsP1++;
      if (reason === 'ace') {
        this.stats.acesP1++;
        this.announce('Ace!', 'ace');
        sound.playCrowdApplause('cheer');
      } else if (reason === 'winner') {
        this.stats.winnersP1++;
      } else if (reason === 'unforced_error') {
        this.stats.unforcedErrorsP2++;
      }
    } else {
      this.stats.totalPointsP2++;
      if (reason === 'ace') {
        this.stats.acesP2++;
        this.announce('Ace!', 'ace');
        sound.playCrowdApplause('cheer');
      } else if (reason === 'winner') {
        this.stats.winnersP2++;
      } else if (reason === 'unforced_error') {
        this.stats.unforcedErrorsP1++;
      }
    }

    // Reset second serve flag for next point
    this.score.secondServe = false;

    // Check if Tiebreak
    if (this.score.isTiebreak) {
      this.handleTiebreakPoint(winner);
      return;
    }

    // Standard Game Scoring
    const p1 = this.score.player1Points;
    const p2 = this.score.player2Points;

    if (winner === 1) {
      if (p1 === 0) {
        this.score.player1Points = 15;
      } else if (p1 === 15) {
        this.score.player1Points = 30;
      } else if (p1 === 30) {
        this.score.player1Points = 40;
      } else if (p1 === 40) {
        if (p2 === 40) {
          // Deuce -> Ad P1
          this.score.player1Points = 'AD';
          this.announce('Advantage Player 1', 'match_point');
        } else if (p2 === 'AD') {
          // Ad P2 -> Deuce
          this.score.player2Points = 40;
          this.announce('Deuce', 'game');
        } else {
          // Won game!
          this.awardGame(1);
          return;
        }
      } else if (p1 === 'AD') {
        // Ad P1 -> Won game!
        this.awardGame(1);
        return;
      }
    } else {
      // Winner is Player 2
      if (p2 === 0) {
        this.score.player2Points = 15;
      } else if (p2 === 15) {
        this.score.player2Points = 30;
      } else if (p2 === 30) {
        this.score.player2Points = 40;
      } else if (p2 === 40) {
        if (p1 === 40) {
          this.score.player2Points = 'AD';
          this.announce('Advantage Player 2', 'match_point');
        } else if (p1 === 'AD') {
          this.score.player1Points = 40;
          this.announce('Deuce', 'game');
        } else {
          this.awardGame(2);
          return;
        }
      } else if (p2 === 'AD') {
        this.awardGame(2);
        return;
      }
    }

    // Switch serving side for next point (Right/Deuce <-> Left/Ad)
    this.score.servingSide = this.score.servingSide === 'deuce' ? 'ad' : 'deuce';

    // Announce score if not already deuce/advantage
    this.announceCurrentScore();
  }

  private announceCurrentScore() {
    const p1 = this.score.player1Points;
    const p2 = this.score.player2Points;

    if (p1 === 'AD' || p2 === 'AD') return; // Handled above

    if (p1 === 40 && p2 === 40) {
      this.announce('Deuce', 'game');
      return;
    }

    const fmt = (pt: number | 'AD') => (pt === 0 ? 'Love' : pt.toString());
    const isServerP1 = this.score.server === 1;

    let phrase = '';
    if (p1 === p2) {
      phrase = `${fmt(p1)} All`;
    } else if (isServerP1) {
      phrase = `${fmt(p1)} - ${fmt(p2)}`;
    } else {
      phrase = `${fmt(p2)} - ${fmt(p1)}`;
    }

    this.announce(phrase, 'in');
  }

  private handleTiebreakPoint(winner: 1 | 2) {
    if (winner === 1) {
      this.score.player1TiebreakPoints++;
    } else {
      this.score.player2TiebreakPoints++;
    }

    const tp1 = this.score.player1TiebreakPoints;
    const tp2 = this.score.player2TiebreakPoints;
    const totalPoints = tp1 + tp2;

    this.announce(`${tp1} - ${tp2}`, 'in');

    // Tiebreak serving rotation: server switches after 1st point, then every 2 points
    if (totalPoints % 2 === 1) {
      this.score.server = this.score.server === 1 ? 2 : 1;
    }
    this.score.servingSide = this.score.servingSide === 'deuce' ? 'ad' : 'deuce';

    // Win condition: at least 7 points, and ahead by at least 2
    if ((tp1 >= 7 || tp2 >= 7) && Math.abs(tp1 - tp2) >= 2) {
      const tbWinner = tp1 > tp2 ? 1 : 2;
      this.awardGame(tbWinner);
    }
  }

  private awardGame(winner: 1 | 2) {
    sound.playCrowdApplause('cheer');

    if (winner === 1) {
      this.score.player1Games++;
    } else {
      this.score.player2Games++;
    }

    const g1 = this.score.player1Games;
    const g2 = this.score.player2Games;

    // Reset game points
    this.score.player1Points = 0;
    this.score.player2Points = 0;
    this.score.servingSide = 'deuce';

    // Rotate server for next game
    this.score.server = this.score.server === 1 ? 2 : 1;

    this.announce(`Game ${winner === 1 ? 'Player 1' : 'Player 2'}`, 'game');

    // Check Set Win Condition
    // First to 6 games with 2 game lead, or tiebreak winner at 7-6
    const setWon =
      (g1 >= 6 && g1 - g2 >= 2) ||
      (g2 >= 6 && g2 - g1 >= 2) ||
      (this.score.isTiebreak && (g1 === 7 || g2 === 7));

    if (setWon) {
      this.awardSet(g1 > g2 ? 1 : 2);
    } else if (g1 === 6 && g2 === 6) {
      // Enter Tiebreak!
      this.score.isTiebreak = true;
      this.score.player1TiebreakPoints = 0;
      this.score.player2TiebreakPoints = 0;
      this.announce('Tiebreak', 'game');
    }
  }

  private awardSet(winner: 1 | 2) {
    const curSet = this.score.currentSet;
    this.score.player1Sets[curSet] = this.score.player1Games;
    this.score.player2Sets[curSet] = this.score.player2Games;

    sound.playCrowdApplause('roar');
    this.announce(`Set ${winner === 1 ? 'Player 1' : 'Player 2'}`, 'set');

    // Count sets won
    let setsWonP1 = 0;
    let setsWonP2 = 0;
    for (let i = 0; i <= curSet; i++) {
      if (this.score.player1Sets[i] > this.score.player2Sets[i]) setsWonP1++;
      else setsWonP2++;
    }

    if (setsWonP1 === this.setsToWin) {
      this.score.winner = 1;
      this.announce('Game, Set and Match! Player 1 wins!', 'winner');
      sound.playVictoryFanfare();
    } else if (setsWonP2 === this.setsToWin) {
      this.score.winner = 2;
      this.announce('Game, Set and Match! Player 2 wins!', 'winner');
      sound.playVictoryFanfare();
    } else {
      // Move to next set
      this.score.currentSet++;
      this.score.player1Games = 0;
      this.score.player2Games = 0;
      this.score.player1Sets.push(0);
      this.score.player2Sets.push(0);
      this.score.isTiebreak = false;
    }
  }
}

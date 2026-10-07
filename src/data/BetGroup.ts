import { Bet } from './Bet';

export class BetGroup {
  id: string;
  description: string;
  bets: Bet[];

  constructor(id: string, description: string, bets: Bet[]) {
    this.id = id;
    this.description = description;
    this.bets = bets;
  }
}

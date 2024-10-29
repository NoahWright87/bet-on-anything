import { Bet } from './Bet';

class BetGroup {
  id: string;
  description: string;
  bets: Bet[];

  constructor(id: string, description: string, bets: Bet[]) {
    this.id = id;
    this.description = description;
    this.bets = bets;
  }
}

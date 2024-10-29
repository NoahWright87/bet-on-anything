import { User } from './User';
import { Bet } from './Bet';

class Board {
  id: string;
  code: string;
  description: string;
  isOpen: boolean;
  participants: User[];
  bets: Bet[];

  constructor(id: string, code: string, description: string, isOpen: boolean, participants: User[], bets: Bet[]) {
    this.id = id;
    this.code = code;
    this.description = description;
    this.isOpen = isOpen;
    this.participants = participants;
    this.bets = bets;
  }
}

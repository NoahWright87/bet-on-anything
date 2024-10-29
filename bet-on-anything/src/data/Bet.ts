import { UserBet } from './UserBet';

class Bet {
  id: string;
  description: string;
  userBets: UserBet[];
  isResolved: boolean;

  constructor(id: string, description: string, userBets: UserBet[], isResolved: boolean) {
    this.id = id;
    this.description = description;
    this.userBets = userBets;
    this.isResolved = isResolved;
  }
}

import { User } from './User';

export class UserBet {
  id: string;
  user: User;
  amount: number;

  constructor(id: string, user: User, amount: number) {
    this.id = id;
    this.user = user;
    this.amount = amount;
  }
}

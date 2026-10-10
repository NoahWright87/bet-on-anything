# Betting rules and open questions

What the game does today, and what is still undecided. Payout math is in `shared/bets.ts` and the checks on every action are in `shared/table.ts`; the Worker enforces them and the app imports the same files, so change the rules there.

## The model (as built)

- A **bet** is a question ("Challenge winner") with any number of **guesses** ("Andy", "Betty"). Anyone can add a guess with the `+` chip.
- Players put chips on a guess. A guess's chip stack shows one chip per backer (each player has their own color, you are blue, the house is gray) with the total on the front chip.
- Every bet has a built-in **Not that** outcome, always on the far right.
- **House bid:** every time a player bets on a guess, the house automatically adds a bet on Not that: `houseBidPercent` of that bet (default 1%, rounded to a whole chip), but at least `houseBidMin` (default 1). A bet of 50 or more adds 1 or more; smaller bets still add the minimum. So a lone winner still earns something, nobody goes broke, and the house pool grows with every bet, which rewards betting early and often. House chips are minted, so chip counts inflate on purpose. Setting both to 0 turns it off: Not that stays, it just gets no automatic bets. Bets on Not that itself don't trigger a house bid. The host sets these per table in **Table settings** (avatar menu), and changes apply to open bets.
- Players may bet any number of times, on the same guess or different ones.
- **Payout is pooled:** everything staked (house included) is split among the backers of the winning guess in proportion to their stakes. Largest-remainder rounding, so no chip is lost to rounding. The house's own share disappears.
  - Example: Andy 50 + 25, Betty 100, house 3 (1% of each bet, minimum 1). Pot 178. If Andy wins: 50/75 -> 119, 25/75 -> 59. If Betty wins she gets 178. If nobody backed Not that and it "wins", all 178 vanish.
- **Settling:** tap any chip, open "Settle this bet", and say that guess was correct. That proposes a result; a different set of players must confirm it (`confirmationsRequired`, default 2, the proposer counts as one). Changing the proposal or adding a guess restarts confirmations. Once enough agree, chips are paid out.
- **Ties:** mark more than one guess correct before confirming; all winning stakes pool together. "Not that" and real guesses exclude each other.
- **Activity order:** any new bet, wager, new guess, proposal, confirmation or settlement moves that bet to the top.
- **Closing a table:** the host (the first player to join) closes it from Table settings (avatar menu). No new bets or wagers afterward, but open bets can still be settled.
- **Chips are derived:** a player's chips are 1,000 minus everything they staked plus everything they were paid (`chipsOf` in `shared/bets.ts`), never stored, so every player's balance always adds up from the bets.
- **Table settings** (host): house bid %, house bid minimum, and how many people must agree to settle a bet. Closing the table is in the same dialog.

## Decide next

- [ ] **House bid rounding:** 1% of 50 rounds to 1, of 49 to 0 (so the minimum applies). Fine, or should the percentage round up? Is a percentage of the *bet* right, or of the pot so far?
- [ ] **Who may confirm a result?** Today any other player. Guard against "bet, then declare yourself the winner": require at least one confirmer who did not back the winning guess? Host override? Allow the host to settle alone?
- [ ] **Betting on "Not that" explicitly** is risky because more guesses can be added later (it dilutes the house bid per guess, and a late guess can win). Lock explicit Not-that wagers once there are N guesses? Warn more loudly? Today there is only a muted warning.
- [ ] **Late guesses:** can anyone add a guess after others have bet? Allow only while no result is proposed (today a new guess cancels a proposal)?
- [ ] **Undo:** can a wager be withdrawn? Today no.
- [ ] **Limits:** minimum/maximum stake. Already enforced (`shared/limits.ts`): 30 players per table, 300 bets, 12 guesses per bet, 500 wagers per bet, title/guess/name lengths 60/24/24. Are those the right numbers?
- [ ] **Names:** a player is their name at the table, unique ignoring case. Fine for friends; two people can't both be "Sam".
- [ ] **Naming:** the second field in the New bet form is "Your guess", and the other outcomes are called "guesses". Better words? ("Pick", "Outcome", "Side".)
- [ ] **Players with many backers:** the chip stack shows at most 3 backers' colors. Is that enough, or show "+N"?
- [ ] **Rooms:** a Room holds several Tables shared by a group, with shared currency. Chips are per table today (1,000 on joining).
- [ ] Long-running tables (a whole season): archive old settled bets, collapse them under "Settled".

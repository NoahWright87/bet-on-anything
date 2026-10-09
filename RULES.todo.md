# Betting rules and open questions

What the placeholder UI does today (`src/lib/bets.ts`, state in `src/lib/game.tsx`), and what is still undecided. Change the rules in `bets.ts`; the Worker should reuse that file.

## The model (as built)

- A **bet** is a question ("Challenge winner") with any number of **guesses** ("Andy", "Betty"). Anyone can add a guess with the `+` chip.
- Players put chips on a guess. A guess's chip stack shows one chip per backer (each player has their own color, you are blue, the house is gray) with the total on the front chip.
- Every bet has a built-in **Not that** outcome, always on the far right, backed automatically by the **house**: `houseBid` chips (default 1) for every listed guess. So a lone winner still earns something, and nobody goes broke. House chips are minted, so chip counts inflate over time on purpose.
- **Payout is pooled:** everything staked (house included) is split among the backers of the winning guess in proportion to their stakes. Largest-remainder rounding, so no chip is lost to rounding. The house's own share disappears.
  - Example: Andy 50 + 25, Betty 100, house 2 (1 per guess). Pot 177. If Andy wins: 50/75 -> 118, 25/75 -> 59. If Betty wins she gets 177. If nobody backed Not that and it "wins", all 177 vanish.
- **Settling:** tap any chip, open "Settle this bet", and say that guess was correct. That proposes a result; a different set of players must confirm it (`confirmationsRequired`, default 2, the proposer counts as one). Changing the proposal or adding a guess restarts confirmations. Once enough agree, chips are paid out.
- **Ties:** mark more than one guess correct before confirming; all winning stakes pool together. "Not that" and real guesses exclude each other.
- **Activity order:** any new bet, wager, new guess, proposal, confirmation or settlement moves that bet to the top.
- **Closing a table:** the host (placeholder: whoever is viewing) closes it from the avatar menu. No new bets or wagers afterward, but open bets can still be settled.
- Table-level numbers (`houseBid`, `confirmationsRequired`) live in `TableSettings` but have no UI yet.

## Decide next

- [ ] **House bid:** flat per guess, or a percentage of the bet? Should the host configure it per table?
- [ ] **Who may confirm a result?** Today any other player. Guard against "bet, then declare yourself the winner": require at least one confirmer who did not back the winning guess? Host override? Allow the host to settle alone?
- [ ] **Betting on "Not that" explicitly** is risky because more guesses can be added later (it dilutes the house bid per guess, and a late guess can win). Lock explicit Not-that wagers once there are N guesses? Warn more loudly? Today there is only a muted warning.
- [ ] **Late guesses:** can anyone add a guess after others have bet? Allow only while no result is proposed (today a new guess cancels a proposal)?
- [ ] **Undo:** can a wager be withdrawn? Today no.
- [ ] **Limits:** minimum/maximum stake, max guesses per bet, max length of titles/guesses (60/24 today).
- [ ] **Naming:** the second field in the New bet form is "Your guess", and the other outcomes are called "guesses". Better words? ("Pick", "Outcome", "Side".)
- [ ] **Players with many backers:** the chip stack shows at most 3 backers' colors. Is that enough, or show "+N"?
- [ ] **Rooms:** a Room holds several Tables shared by a group, with shared currency. Chips are per table today (1,000 on joining).
- [ ] Long-running tables (a whole season): archive old settled bets, collapse them under "Settled".

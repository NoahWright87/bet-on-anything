import { Card, Heading, Text } from "../../../ui";

export default function Table() {
  return (
    <div className="page">
      <Heading level={2}>Bets</Heading>
      <Card flat title="Nothing to bet on yet">
        <Text tone="muted">Placeholder: bets will show up here. Your room code and chips are always in the bar below.</Text>
      </Card>
    </div>
  );
}

import { Card, Heading, Text } from "../../ui";

export default function History() {
  return (
    <div className="page">
      <Heading level={1} eyebrow="History">Past bets</Heading>
      <Card title="Nothing here yet" flat>
        <Text tone="muted">Settled bets will show up here once tables can be saved.</Text>
      </Card>
    </div>
  );
}

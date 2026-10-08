import { Card, Heading, Link, Text } from "../../ui";

export default function About() {
  return (
    <div className="page">
      <Heading level={1} eyebrow="About">Bet on Anything</Heading>
      <Card title="What is this?" elevated>
        <Text>
          A tiny side project for making friendly wagers with friends. Create a table, share the
          room code, and keep score. It&apos;s a work in progress.
        </Text>
      </Card>
      <Text tone="muted">
        A side project by <Link href="https://noahwright.dev" isExternal>Noah Wright</Link>, styled
        with <Link href="https://github.com/NoahWright87/design" isExternal>@noahwright/design</Link>.
      </Text>
    </div>
  );
}

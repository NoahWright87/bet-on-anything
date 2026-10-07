"use client";

import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Footer, Header, Heading, HamburgerMenu, Layout, Link, Menu } from "@noahwright/design";
import ThemeToggle from "./ThemeToggle";

const NAV = [
  { text: "Home", href: "/" },
  { text: "History", href: "/history" },
  { text: "About", href: "/about" },
];

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Layout
      header={
        <Header
          left={
            <Menu
              label="Navigation"
              trigger={<HamburgerMenu />}
              items={NAV.map((item) => ({
                text: item.text,
                current: pathname === item.href,
                onClick: () => router.push(item.href),
              }))}
            />
          }
          center={
            <NextLink href="/" style={{ color: "inherit", textDecoration: "none" }}>
              <Heading level={1}>Bet on Anything</Heading>
            </NextLink>
          }
          right={<ThemeToggle />}
        />
      }
      footer={
        <Footer
          left={<Link as={NextLink} href="/about" variant="subtle">About</Link>}
          center={
            <>
              Copyright ©{" "}
              <Link href="https://noahwright.dev" isExternal>Noah Wright</Link>{" "}
              {new Date().getFullYear()}
            </>
          }
          right={
            <Link
              href="https://github.com/NoahWright87/bet-on-anything"
              isExternal
              variant="subtle"
            >
              Source
            </Link>
          }
        />
      }
    >
      {children}
    </Layout>
  );
}

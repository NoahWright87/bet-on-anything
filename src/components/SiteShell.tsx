"use client";

import NextLink from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { Footer, Header, Heading, HamburgerMenu, Layout, Link, Menu } from "@noahwright/design";
import { tableCodeFromParam } from "../lib/roomCode";
import TableFooter from "./TableFooter";
import UserMenu from "./UserMenu";

const NAV = [
  { text: "Home", href: "/" },
  { text: "History", href: "/history" },
  { text: "About", href: "/about" },
];

function SiteFooter() {
  return (
    <Footer
      left={
        <span className="site-credit">
          © {new Date().getFullYear()}{" "}
          <Link href="https://noahwright.dev" isExternal>Noah Wright</Link>
        </span>
      }
      right={
        <Link href="https://github.com/NoahWright87/bet-on-anything" isExternal variant="subtle">
          Source
        </Link>
      }
    />
  );
}

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ id?: string }>();

  const inTable = pathname.startsWith("/table/");
  const tableCode = inTable ? tableCodeFromParam(params.id) : "";

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
            <NextLink href="/" className="site-title">
              <Heading level={1}>Bet on Anything</Heading>
            </NextLink>
          }
          right={<UserMenu />}
        />
      }
      footer={inTable ? <TableFooter code={tableCode} /> : <SiteFooter />}
    >
      {children}
    </Layout>
  );
}

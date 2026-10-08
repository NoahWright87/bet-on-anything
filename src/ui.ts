"use client";

// The design system ships plain ESM with hooks and no "use client" markers, so
// every component used from a Server Component goes through this boundary.
export {
  Button,
  Card,
  CardGrid,
  Container,
  Footer,
  HamburgerMenu,
  Heading,
  Hero,
  Input,
  Layout,
  Link,
  Menu,
  Pill,
  Text,
  ToggleIcon,
} from "@noahwright/design";

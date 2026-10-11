"use client";

import { faCloudflare, faGithub } from "@fortawesome/free-brands-svg-icons";
import { Tooltip } from "@noahwright/design";

// Netlify mark from Simple Icons (CC0), https://simpleicons.org/?q=netlify.
// Font Awesome supplies the Cloudflare and GitHub brand paths.
const faNetlify = { icon: [24, 24, [], "", "M6.49 19.04h-.23L5.13 17.9v-.23l1.73-1.71h1.2l.15.15v1.2L6.5 19.04ZM5.13 6.31V6.1l1.13-1.13h.23L8.2 6.68v1.2l-.15.15h-1.2L5.13 6.31Zm9.96 9.09h-1.65l-.14-.13v-3.83c0-.68-.27-1.2-1.1-1.23-.42 0-.9 0-1.43.02l-.07.08v4.96l-.14.14H8.9l-.13-.14V8.73l.13-.14h3.7a2.6 2.6 0 0 1 2.61 2.6v4.08l-.13.14Zm-8.37-2.44H.14L0 12.82v-1.64l.14-.14h6.58l.14.14v1.64l-.14.14Zm17.14 0h-6.58l-.14-.14v-1.64l.14-.14h6.58l.14.14v1.64l-.14.14ZM11.05 6.55V1.64l.14-.14h1.65l.14.14v4.9l-.14.14h-1.65l-.14-.13Zm0 15.81v-4.9l.14-.14h1.65l.14.13v4.91l-.14.14h-1.65l-.14-.14Z"] as const };

const LINKS = [
  { label: "Powered by Netlify", href: "https://www.netlify.com/", icon: faNetlify },
  { label: "Runs on Cloudflare", href: "https://www.cloudflare.com/", icon: faCloudflare },
  { label: "View source on GitHub", href: "https://github.com/NoahWright87/bet-on-anything", icon: faGithub },
];

export default function InfrastructureLinks() {
  return (
    <nav className="site-footer__links" aria-label="Site infrastructure and source">
      {LINKS.map(({ label, href, icon }) => (
        <Tooltip key={href} content={label} placement="top">
          <a href={href} aria-label={label} target="_blank" rel="noopener noreferrer">
            <svg viewBox={`0 0 ${icon.icon[0]} ${icon.icon[1]}`} width="22" height="22" fill="currentColor" aria-hidden="true" focusable="false">
              {(Array.isArray(icon.icon[4]) ? icon.icon[4] : [icon.icon[4]]).map((path) => <path key={path} d={path} />)}
            </svg>
          </a>
        </Tooltip>
      ))}
    </nav>
  );
}

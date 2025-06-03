"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AiOutlineHome } from "react-icons/ai";
import { AiOutlinePlusCircle } from "react-icons/ai";
import { HiOutlineLightBulb } from "react-icons/hi";
import { FiBarChart2 } from "react-icons/fi";

import "./BTBottomNav3.css";

export default function BTBottomNav() {
  const pathname = usePathname();

  const tabs = [
    { href: "/profile", label: "home", Icon: AiOutlineHome },
    { href: "/add-new-session", label: "session", Icon: AiOutlinePlusCircle },
    {
      href: "/advice",
      label: "advice",
      Icon: HiOutlineLightBulb,
    },
  ];

  return (
    <nav className="bt-nav">
      {tabs.map(({ href, label, Icon }) => {
        const active = pathname === href;
        return (
          <Link key={href} href={href} className="bt-nav-item">
            <Icon
              className={`bt-nav-icon ${active ? "is-active" : ""}`}
              aria-hidden
            />
            <span className={`bt-nav-label ${active ? "is-active" : ""}`}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

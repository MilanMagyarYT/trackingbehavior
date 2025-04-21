"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { BsPersonAdd } from "react-icons/bs";
import { MdLogin, MdClose, MdAccountCircle } from "react-icons/md";
import { IoMdMenu } from "react-icons/io";
import { FaHouse } from "react-icons/fa6";
import { IoMdHelpCircleOutline } from "react-icons/io";
import "./BTNavbar.css";
import { useAppSelector } from "@/app/store";
import { MdLogout } from "react-icons/md";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";

function getInitials(name: string | null | undefined) {
  if (!name) return "";
  const [first = "", last = ""] = name.trim().split(/\s+/);
  return (first[0] || "").toUpperCase() + (last[0] || "").toUpperCase();
}

export default function BTNavbar() {
  const router = useRouter();
  const { status, displayName } = useAppSelector((s) => s.auth);
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen((p) => !p);
  const closeMenu = () => setMenuOpen(false);

  const navTo = (path: string) => {
    closeMenu();
    router.push(path);
  };

  const handleLogout = async () => {
    closeMenu();
    await signOut(auth);
    router.push("/");
  };

  const initials = getInitials(displayName);

  return (
    <nav className="navbar">
      {/* Logo */}
      <div className="navbar__logo" onClick={() => navTo("/")}>
        <Image
          src="/trackingbehaviorlogo2.png"
          alt="Tracking Behavior"
          width={125}
          height={50}
        />
      </div>

      {/* Hamburger */}
      <div className="navbar__icons">
        {status !== "authenticated" && (
          <MdAccountCircle
            className="navbar__icon"
            title="Login"
            onClick={() => navTo("/login")}
          />
        )}
        {status === "unauthenticated" && (
          <IoMdMenu
            className="navbar__icon"
            title="Open menu"
            onClick={toggleMenu}
          />
        )}
        {status === "authenticated" && (
          <button
            className="navbar__avatar"
            title="Open menu"
            onClick={toggleMenu}
          >
            {initials}
          </button>
        )}
      </div>

      {/* Dark overlay */}
      <div
        className={`navbar__overlay ${menuOpen ? "open" : ""}`}
        onClick={closeMenu}
      />

      {/* Slide‑in panel */}
      <div className={`navbar__mobileMenu ${menuOpen ? "open" : ""}`}>
        {/* Header */}
        <div className="mobileMenu__header">
          <Image
            src="/trackingbehaviorlogo2.png"
            alt="Tracking Behavior"
            width={125}
            height={50}
            onClick={() => navTo("/")}
          />
          <MdClose
            className="navbar__icon mobileMenu__close"
            title="Close menu"
            onClick={closeMenu}
          />
        </div>

        <div className="mobileMenu__actions">
          <button
            className="mobileMenu__button"
            onClick={() => navTo("/create-account")}
          >
            <BsPersonAdd className="mobileMenu__icon" />
            Sign up
          </button>
          <button
            className="mobileMenu__button"
            onClick={() => navTo("/login")}
          >
            <MdLogin className="mobileMenu__icon" />
            Log in
          </button>
        </div>

        {/* Menu links */}
        <ul className="mobileMenu__list">
          <li onClick={() => navTo("/how-it-works")}>
            <FaHouse className="mobileMenu__icon" />
            How it works
          </li>
          <li onClick={() => navTo("/help")}>
            <IoMdHelpCircleOutline className="mobileMenu__icon" />
            Help
          </li>
          {status === "authenticated" && (
            <li onClick={handleLogout}>
              <MdLogout className="mobileMenu__icon" /> Log out
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}

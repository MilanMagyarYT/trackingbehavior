"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { BsPersonAdd } from "react-icons/bs";
import { MdLogin, MdClose } from "react-icons/md";
import { IoMdMenu } from "react-icons/io";
import { FaHouse } from "react-icons/fa6";
import { IoMdHelpCircleOutline } from "react-icons/io";
import "./BTNavbar.css";
import { useAppSelector } from "@/app/store";
import { MdLogout } from "react-icons/md";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";
import { MdOutlineManageAccounts } from "react-icons/md";
import { IoMdAddCircleOutline } from "react-icons/io";
import { IoCalendar } from "react-icons/io5";
import { IoNotifications } from "react-icons/io5";

function getInitials(name: string | null | undefined) {
  if (!name) return "";
  const [first = "", last = ""] = name.trim().split(/\s+/);
  return (first[0] || "").toUpperCase() + (last[0] || "").toUpperCase();
}

export default function BTNavbar() {
  const router = useRouter();
  const { status, displayName, email } = useAppSelector((s) => s.auth);
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
      <div className="navbar__logo" onClick={() => navTo("/")}>
        <Image
          src="/trackingbehaviorlogo2.png"
          alt="Tracking Behavior"
          width={125}
          height={50}
        />
      </div>

      <div className="navbar__icons">
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

        {status === "authenticated" ? (
          <div className="mobileMenu__user">
            <div className="mobileMenu__avatar">{initials}</div>
            <div className="mobileMenu__userInfo">
              <div className="mobileMenu__userName">{displayName}</div>
              <div className="mobileMenu__userEmail">{email}</div>
            </div>
          </div>
        ) : (
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
        )}

        {status === "authenticated" ? (
          <div>
            <ul className="mobileMenu__list">
              <li onClick={() => navTo("/start-setup")}>
                <MdOutlineManageAccounts className="mobileMenu__icon" />
                Set‑Up Account
              </li>
              <li onClick={() => navTo("/add-new-session")}>
                <IoMdAddCircleOutline className="mobileMenu__icon" />
                Add New Session
              </li>
              <li onClick={() => navTo("/view-sessions")}>
                <IoCalendar className="mobileMenu__icon" />
                Today&apos;s Sessions
              </li>
              <li onClick={() => navTo("/view-recommendations")}>
                <IoNotifications className="mobileMenu__icon" />
                Recommendations
              </li>
            </ul>

            {/* big separator between sections */}
            <div className="mobileMenu__sectionDivider" />

            <ul className="mobileMenu__list">
              <li onClick={() => navTo("/how-it-works")}>
                <FaHouse className="mobileMenu__icon" />
                How it works
              </li>
              <li onClick={() => navTo("/help")}>
                <IoMdHelpCircleOutline className="mobileMenu__icon" />
                Help
              </li>
              <li onClick={handleLogout}>
                <MdLogout className="mobileMenu__icon" />
                Log out
              </li>
            </ul>
          </div>
        ) : (
          <ul className="mobileMenu__list">
            <li onClick={() => navTo("/how-it-works")}>
              <FaHouse className="mobileMenu__icon" />
              How it works
            </li>
            <li onClick={() => navTo("/help")}>
              <IoMdHelpCircleOutline className="mobileMenu__icon" />
              Help
            </li>
          </ul>
        )}
      </div>
    </nav>
  );
}

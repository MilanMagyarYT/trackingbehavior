"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { GiCharacter } from "react-icons/gi";
import { IoMdMenu, IoMdClose } from "react-icons/io";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";
import { useAppSelector } from "@/app/store";
import "./BTNavbar.css";

export default function BTNavbar() {
  const router = useRouter();
  const { status } = useAppSelector((s) => s.auth);
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen((p) => !p);
  const closeMenu = () => setMenuOpen(false);

  /* ---- handlers ---- */
  const handleLogin = () => {
    closeMenu();
    router.push("/login");
  };
  const handleHome = () => {
    closeMenu();
    router.push("/");
  };
  const handleProfile = () => {
    closeMenu();
    router.push("/profile");
  };
  const handleSignUp = () => {
    closeMenu();
    router.push("/create-account");
  };

  const handleLogout = async () => {
    closeMenu();
    await signOut(auth); // triggers onAuthStateChanged → Redux clearUser
    router.push("/"); // optional: bounce to landing page
  };

  return (
    <nav className="navbar">
      {/* ---------- logo ---------- */}
      <div className="navbar__logo" onClick={handleHome}>
        <Image
          src="/trackingbehaviorlogo.png"
          alt="Tracking Behavior Logo"
          width={200}
          height={50}
        />
      </div>

      {/* ---------- right‑side icons ---------- */}
      <div className="navbar__icons">
        {/* account icon only when NOT logged in */}
        {status !== "authenticated" && (
          <GiCharacter
            className="navbar__icon"
            title="Login"
            onClick={handleLogin}
          />
        )}

        {/* hamburger / close */}
        <div className="navbar__menuWrapper">
          {menuOpen ? (
            <IoMdClose
              className="navbar__icon"
              title="Close menu"
              onClick={toggleMenu}
            />
          ) : (
            <IoMdMenu
              className="navbar__icon"
              title="Open menu"
              onClick={toggleMenu}
            />
          )}

          {menuOpen && (
            <div className="navbar__dropdown">
              <ul>
                <li onClick={handleHome}>Home</li>
                {status === "authenticated" && (
                  <li onClick={handleProfile}>Profile</li>
                )}
                {status !== "authenticated" && (
                  <li onClick={handleSignUp}>Sign Up</li>
                )}
                {status === "authenticated" && (
                  <li onClick={handleLogout}>Log out</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

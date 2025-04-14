"use client";

import { useState, useEffect } from "react";
import BTButton from "./BTButton";
import { GiHamburgerMenu } from "react-icons/gi";
import "./styling/Navbar.css";
import { useRouter } from "next/navigation";

export default function BTNavbar() {
  const router = useRouter();
  const [hamburgerOpen, setHamburgerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function handleOnClick() {
    setHamburgerOpen(true);
  }

  function handleClose() {
    setHamburgerOpen(false);
  }

  function openProjectDetails() {
    router.push("/");
  }

  function openLogin() {
    router.push("/login");
  }

  function openCreateAccount() {
    router.push("/create-account");
  }
  /*
  return (
    <nav className="navbar">
      <img src="/officiallogo.png" alt="Logo Here" className="logo" />

      <BTButton text="Project Details" onClick={openProjectDetails} />

      {isMobile && (
        <GiHamburgerMenu onClick={handleOnClick} className="hamburger-icon" />
      )}

      {hamburgerOpen && isMobile && (
        <div className="sidebar">
          <BTButton text="Close" onClick={handleClose} />
        </div>
      )}
    </nav>
  );*/
  return (
    <nav className="navbar">
      <img src="/officiallogo.png" alt="Logo Here" className="logo" />
      <BTButton text="Project Details" onClick={openProjectDetails} />
      <BTButton text="Create Account" onClick={openCreateAccount} />
      <BTButton text="Log in" onClick={openLogin} />
    </nav>
  );
}

"use client";

import BTButton from "./BTButton";
import "./styling/Navbar.css";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function BTNavbar() {
  const router = useRouter();

  function openProjectDetails() {
    router.push("/");
  }

  function openLogin() {
    router.push("/login");
  }

  function openCreateAccount() {
    router.push("/create-account");
  }

  return (
    <nav className="navbar">
      <Image
        src="/officiallogo.png"
        alt="Logo Here"
        width={100} // Set an appropriate width value
        height={50} // Set an appropriate height value
        className="logo"
      />
      <BTButton text="Project Details" onClick={openProjectDetails} />
      <BTButton text="Create Account" onClick={openCreateAccount} />
      <BTButton text="Log in" onClick={openLogin} />
    </nav>
  );
}

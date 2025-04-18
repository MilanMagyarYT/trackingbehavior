"use client";

import { RxDividerHorizontal } from "react-icons/rx";
import BTButton from "./components/BTButton";
import BTNavbar from "./components/BTNavbar";
import Image from "next/image";
import { useRouter } from "next/navigation";
import "./Home.css";

export default function Home() {
  const router = useRouter();

  return (
    <div>
      <BTNavbar />
      <div className="home">
        {/* 1. Headline */}
        <h1 className="home__title">
          Track your social media behavior to build better habits
        </h1>

        {/* 2. Hero image */}
        <div className="home__hero">
          <Image
            src="/heroimage.png"
            alt="Hero Illustration"
            width={600}
            height={400}
          />
        </div>

        {/* 3. Create account button */}
        <div className="home__cta">
          <BTButton
            text="Create an account"
            onClick={() => router.push("/create-account")}
          />
        </div>

        {/* 4. Login prompt */}
        <p className="home__login">
          Already have an account?{" "}
          <span onClick={() => router.push("/login")}>Login</span>
        </p>

        {/* 5. Divider */}
        <div className="home__divider">
          <RxDividerHorizontal />
        </div>

        {/* 6. Benefits section */}
        <h2 className="home__subtitle">
          Benefits of Context Aware Time Tracking
        </h2>
        <p className="home__text">
          Through research of other tracking system available online, almost all
          focus on building systems that rely on indirect metrics from users.
        </p>
      </div>
    </div>
  );
}

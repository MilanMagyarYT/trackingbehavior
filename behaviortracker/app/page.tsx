"use client";

import { useRouter } from "next/navigation";
import "./components/LandingPage.css";
import BTTextBubble from "./components/BTTextBubble";
import BTNavbar from "./components/BTNavbar";
import BTTextTitle from "./components/BTTextTitle";
import BTTextSubTitle from "./components/BTTextSubTitle";
import BTButtonCTA from "./components/BTButtonCTA";
import BTDoubleBubble from "./components/BTDoubleBubble";
import BTText from "./components/BTText";
import BTSideBySideImage from "./components/BTSideBySideImage";
import BTCard from "./components/BTCard";
import BTTestimonial from "./components/BTTestimonial";
import BTImagePairBox from "./components/BTImagePairBox";
import Image from "next/image";
import BTTextTitle2 from "./components/BTTextTitle2";
import BTButtonCTA2 from "./components/BTButtonCTA2";
import BTText2 from "./components/BTText2";
import BTFooter from "./components/BTFooter";
import { useAppSelector } from "./store";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();
  const { status } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/profile");
    }
  }, [status, router]);

  return (
    <div className="landingpage">
      <BTNavbar />
      <BTTextBubble text="best for people who desire change" />
      <BTTextTitle text="learn to improve your social-media habits" />
      <BTTextSubTitle>
        a tool built for
        <br />
        students by students.
      </BTTextSubTitle>
      <BTButtonCTA
        text="start behavior tracking"
        onChange={() => {
          router.replace("/create-account");
        }}
      />
      <BTDoubleBubble />
      <BTText text="my personal background" />
      <BTSideBySideImage />
      <section id="how-it-works">
        <BTTextBubble text="behavior tracking explained" />
        <BTTextTitle text="how it works" />
        <BTTextSubTitle>
          the simple three step process
          <br />
          to improving your habits.
        </BTTextSubTitle>
        <BTCard
          step={1}
          img="/Card1.png"
          title="set-up your account"
          description="from defining your average versus target screen time to selecting productive triggers, goals, activities, and content types, personalize your settings so the app can deliver tailored daily recommendations and targets"
        />
        <BTCard
          step={2}
          img="/Card2.png"
          title="track each social-media session"
          description="easily log each social‑media session with one tap: capture app, duration, time, triggers, activities, and mood shifts; the system instantly computes your session score and aggregates them into daily history"
        />
        <BTCard
          step={3}
          img="/Card3.png"
          title="analyze daily insights"
          description="review your personalized daily metrics summary each morning: view your final score, period breakdowns, and tailored recommendation, empowering you to adjust habits, limit unproductive time, and effectively optimize your social‑media use"
        />
        <BTTestimonial
          quote="This tool helped me see the reality behind my screen‑time numbers."
          caption="from Edina Muresan (student)"
        />
      </section>
      <section id="features">
        <BTTextBubble text="tool demo" />
        <BTTextTitle text="custom features" />
        <BTTextSubTitle>
          make improving your social-media
          <br />
          habits a little bit easier.
        </BTTextSubTitle>
        <BTImagePairBox>
          <Image
            src="/sidebysideimage1.png"
            alt=""
            width={140}
            height={140}
            priority
          />
          <Image
            src="/sidebysideimage2.png"
            alt=""
            width={151}
            height={140}
            priority
          />
        </BTImagePairBox>
      </section>
      <section id="start-behavior-tracking">
        <BTTextTitle2 text="ready to start" />
        <BTTextSubTitle>
          make improving your social-media
          <br />
          habits easier.
        </BTTextSubTitle>
        <BTButtonCTA2
          text="start behavior tracking"
          onChange={() => {
            router.replace("/create-account");
          }}
        />
        <BTText2 text="a tool built by a student for students" />
      </section>
      <BTFooter />
    </div>
  );
}

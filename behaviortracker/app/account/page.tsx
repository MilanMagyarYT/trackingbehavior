"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useAppSelector } from "@/app/store";

import BTNavbar from "@/app/components/BTNavbar";
import BTBottomNav from "@/app/components/BTBottomNav";

import "../components/AccountPage.css";
import BTMonthCalendar from "@/app/components/BTMonthCalendar";

export default function AccountPage() {
  const router = useRouter();
  const { uid, status, displayName, email } = useAppSelector((s) => s.auth);

  const [baselineUsage, setBaselineUsage] = useState("");
  const [baselineProd, setBaselineProd] = useState("");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (!uid) return;

    (async () => {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        setLoading(false);
        return;
      }
      const data = userSnap.data();

      setBaselineUsage(data.goalPhoneMin?.toString() || "");
      setBaselineProd(data.unprodGoalPct?.toString() || "");

      setLoading(false);
    })();
  }, [uid, status, router]);

  if (status === "loading" || loading) {
    return (
      <div className="acc-loader">
        <div className="acc-spinner" />
      </div>
    );
  }

  return (
    <div className="acc-page">
      <BTNavbar />
      <main className="acc-container">
        {/* header */}
        <div className="acc-header">
          <div className="acc-avatar">
            {displayName?.charAt(0).toUpperCase()}
          </div>
          <div className="acc-userinfo">
            <h2 className="acc-name">{displayName}</h2>
            <p className="acc-email">{email}</p>
          </div>
        </div>
        <div className="acc-card">
          <div className="acc-card-header">
            <div className="acc-section-title">part 1</div>
            <h3 className="acc-card-title">my calendar</h3>
            <p className="acc-card-sub">
              metrics &amp; usage behavior (since joining)
            </p>
          </div>
          <section className="profile-calendar">
            <BTMonthCalendar />
          </section>
        </div>
        {/* part 1: since joining */}
        {/*<section className="acc-card">
          <div className="acc-card-header">
            <div className="acc-section-title">part 2</div>
            <h3 className="acc-card-title">my account</h3>
            <p className="acc-card-sub">
              metrics &amp; usage behavior (since joining)
            </p>
          </div>

          <div className="acc-row two-cols">
            <div>
              <label>social-media usage</label>
              <input type="number" value={avgUsage} readOnly />
            </div>
            <div>
              <label>productivity %</label>
              <input type="number" value={avgProd} readOnly />
            </div>
          </div>
        </section>*/}

        {/* part 2: baseline */}
        <section className="acc-card">
          <div className="acc-card-header">
            <div className="acc-section-title">part 2</div>
            <h3 className="acc-card-title">my goals</h3>
            <p className="acc-card-sub">
              usage time &amp; productivity percentage behavior
            </p>
          </div>

          <div className="acc-row two-cols">
            <div>
              <label>social-media usage</label>
              <input type="number" value={baselineUsage} readOnly />
            </div>
            <div>
              <label>productivity %</label>
              <input type="number" value={baselineProd} readOnly />
            </div>
          </div>
        </section>
      </main>
      <BTBottomNav />
    </div>
  );
}

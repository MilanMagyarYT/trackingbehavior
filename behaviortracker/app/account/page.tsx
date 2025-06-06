"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  getDocs,
  query,
  where,
  collection,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useAppSelector } from "@/app/store";

import BTNavbar from "@/app/components/BTNavbar";
import BTBottomNav from "@/app/components/BTBottomNav";

import "../components/AccountPage.css";

export default function AccountPage() {
  const router = useRouter();
  const { uid, status, displayName, email } = useAppSelector((s) => s.auth);

  // form state
  const [avgUsage, setAvgUsage] = useState("");
  const [avgProd, setAvgProd] = useState("");
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
      // 1️⃣ load user doc
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        setLoading(false);
        return;
      }
      const data = userSnap.data();

      // set part-2 (baseline) and names
      setBaselineUsage(data.goalPhoneMin?.toString() || "");
      setBaselineProd(data.unprodGoalPct?.toString() || "");

      // 2️⃣ compute “since joining” metrics
      if (data.baselineCompletedAt) {
        const joinTs = (data.baselineCompletedAt as Timestamp).toDate();
        const sessQ = query(
          collection(db, "users", uid, "sessions"),
          where("createdAt", ">=", Timestamp.fromDate(joinTs))
        );
        const sessSnap = await getDocs(sessQ);

        let totalMin = 0;
        let weighted = 0;
        sessSnap.forEach((d) => {
          const { duration, rawScore } = d.data() as {
            duration: number;
            rawScore: number;
          };
          totalMin += duration;
          weighted += duration * rawScore;
        });

        const daysSinceJoin = Math.max(
          1,
          (Date.now() - joinTs.getTime()) / (1000 * 60 * 60 * 24)
        );
        const avgUse = Math.round(totalMin / daysSinceJoin);
        const avgP = totalMin ? Math.round((weighted / totalMin) * 100) : 0;

        setAvgUsage(avgUse.toString());
        setAvgProd(avgP.toString());
      }

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

        {/* part 1: since joining */}
        <section className="acc-card">
          <div className="acc-card-header">
            <div className="acc-section-title">part 1</div>
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
        </section>

        {/* part 2: baseline */}
        <section className="acc-card">
          <div className="acc-card-header">
            <div className="acc-section-title">part 2</div>
            <h3 className="acc-card-title">my baselines</h3>
            <p className="acc-card-sub">
              metrics &amp; usage behavior (when joined)
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

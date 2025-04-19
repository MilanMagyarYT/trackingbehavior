"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import BTNavbar from "@/app/components/BTNavbar";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useAppSelector } from "@/app/store";
import BTButton from "../components/BTButton";
import LoadingSpinner from "../components/LoadingSpinner";

interface SessionStub {
  id: string;
  createdAt: Timestamp;
  appId: string;
  timeBucket: string;
}

export default function ViewSessions() {
  const router = useRouter();
  const { uid, status } = useAppSelector((s) => s.auth);
  const [sessions, setSessions] = useState<SessionStub[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchToday = async () => {
      if (!uid) return;

      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const q = query(
        collection(db, "users", uid, "sessions"),
        where("createdAt", ">=", Timestamp.fromDate(today)),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      const lst: SessionStub[] = [];
      snap.forEach((d) => lst.push({ id: d.id, ...(d.data() as any) }));
      setSessions(lst);
      setLoading(false);
    };
    fetchToday();
  }, [uid]);

  if (status === "loading" || loading)
    return (
      <div>
        <BTNavbar />
        <LoadingSpinner />
      </div>
    );
  if (status === "unauthenticated") {
    router.replace("/login");
    return null;
  }

  const todayStr = new Date().toLocaleDateString();

  return (
    <div>
      <BTNavbar />
      <div className="min-h-screen bg-[#0d1623] flex flex-col items-center py-6 px-4 text-[#f3ede0]">
        <Image
          src="/trackingbehaviorlogo.png"
          alt="logo"
          width={200}
          height={50}
        />
        <div className="w-full max-w-sm md:max-w-md bg-[#00101e] p-6 rounded border border-[#f3ede0] mt-6">
          <h2 className="text-2xl font-bold mb-1">
            View Today’s Tracked Sessions
          </h2>
          <p className="text-sm mb-4">Today: {todayStr}</p>
          <p className="text-sm mb-4">Total sessions: {sessions.length}</p>

          {sessions.map((s, idx) => (
            <div
              key={s.id}
              className="flex items-center mb-3 bg-transparent border border-[#f3ede0] rounded p-2 justify-between"
            >
              <span>
                #{idx + 1} • {s.appId}
              </span>
              <button
                className="px-2 py-1 border border-[#f3ede0] rounded text-xs"
                onClick={() => router.push(`/view-sessions/${s.id}`)}
              >
                Check Data
              </button>
            </div>
          ))}
          {sessions.length === 0 && <p>No sessions logged yet today.</p>}
        </div>
        <BTButton
          text="Back to Profile"
          onClick={() => router.push("/profile")}
        />
      </div>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import BTNavbar from "@/app/components/BTNavbar";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { useAppSelector } from "@/app/store";
import BTButton from "@/app/components/BTButton";
import LoadingSpinner from "@/app/components/LoadingSpinner";

export default function SessionDetailPage() {
  const router = useRouter();
  const params = useParams<{ sid: string }>();
  const { uid, status } = useAppSelector((s) => s.auth);
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!uid) return;
      const ref = doc(db, "users", uid, "sessions", params.sid);
      const snap = await getDoc(ref);
      setData(snap.exists() ? snap.data() : null);
      setLoading(false);
    };
    fetch();
  }, [uid, params.sid]);

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
  if (!data) return <p>Session not found.</p>;

  return (
    <div>
      <BTNavbar />
      <div className="min-h-screen bg-[#0d1623] flex flex-col items-center py-6 px-4 text-[#f3ede0]">
        <div className="w-full max-w-sm md:max-w-md bg-[#00101e] p-6 rounded border border-[#f3ede0] mt-6">
          <h2 className="text-xl font-bold mb-2">{data.appId} session</h2>
          <p className="text-sm mb-2 capitalize">
            Day period: {data.timeBucket}
          </p>
          <hr className="border-[#334455] my-2" />

          <p className="text-sm">Duration: {data.durMin} min</p>
          <p className="text-sm">Primary goal: {data.goalPrimary}</p>
          <p className="text-sm">
            Mood Δ: {data.moodDelta > 0 ? "+" : ""}
            {data.moodDelta}
          </p>
          <p className="text-sm mb-2">
            Self‑rated productivity: {data.prodSelf}/5
          </p>
          <hr className="border-[#334455] my-2" />

          <h3 className="font-semibold mt-2 mb-1 text-sm">Triggers</h3>
          <p className="text-xs mb-2">{data.triggers.join(", ")}</p>

          <h3 className="font-semibold mb-1 text-sm">Engagement</h3>
          <ul className="list-disc list-inside text-xs mb-2">
            {Object.entries(data.engagement)
              .filter(([_, v]) => v)
              .map(([k]) => (
                <li key={k}>{k}</li>
              ))}
          </ul>

          <h3 className="font-semibold mt-1 mb-1 text-sm">Content types</h3>
          <p className="text-xs mb-2">{data.contentMajor.join(", ")}</p>

          <h3 className="font-semibold mt-1 mb-1 text-sm">Context</h3>
          <p className="text-xs">Location: {data.loc}</p>
          <p className="text-xs mb-2">Multitask: {data.multitask}</p>

          <h3 className="font-semibold mt-1 mb-1 text-sm">Session Score</h3>
          <p className="text-xs">{Math.round(data.sessionScore * 100)}/100</p>
        </div>
        <BTButton
          text="Back to Sessions"
          onClick={() => router.push("/view-sessions")}
        />
        <BTButton
          text="Back to Profile"
          onClick={() => router.push("/profile")}
        />
      </div>
    </div>
  );
}

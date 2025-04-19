"use client";
import { useEffect } from "react";
import { listenToAuth } from "@/lib/firebaseClient";

export default function AuthListener() {
  useEffect(() => listenToAuth(), []);
  return null;
}

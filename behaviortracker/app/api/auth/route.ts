import { NextRequest, NextResponse } from "next/server";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error signing in:", error);
    return new NextResponse("Invalid credentials", { status: 401 });
  }
}

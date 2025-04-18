"use client";

import { Provider } from "react-redux";
import { store } from "@/app/store"; // <–– adjust if your store index lives elsewhere

export function Providers({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}

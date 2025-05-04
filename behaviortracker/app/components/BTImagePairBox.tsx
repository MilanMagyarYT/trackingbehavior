import "./BTImagePairBox.css";
import { ReactNode } from "react";

/**
 * A rounded, steel‑blue container meant to hold two images in a row.
 * Usage:
 *   <BTImagePairBox>
 *     <Image src="/one.png"  alt="" width={120} height={120} />
 *     <Image src="/two.png"  alt="" width={120} height={120} />
 *   </BTImagePairBox>
 */
export default function BTImagePairBox({ children }: { children: ReactNode }) {
  return <div className="bt-image-pair-box">{children}</div>;
}

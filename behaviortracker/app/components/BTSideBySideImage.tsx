// BTSideBySideImage.tsx
import Image from "next/image";
import "./BTSideBySideImage.css";

export default function BTSideBySideImage() {
  return (
    <aside className="logos">
      <Image src="/cgi_white-300x0_q100.png" alt="CGI" width={80} height={50} />
      <Image src="/rugr_logoenv_wit_rgb.png" alt="RUG" width={80} height={50} />
    </aside>
  );
}

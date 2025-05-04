import Image from "next/image";
import Link from "next/link";
import "./BTFooter.css";

export default function BTFooter() {
  return (
    <footer className="bt-footer">
      <div className="bt-footer-inner">
        {/* logo + logotype */}
        <div className="bt-footer-brand">
          <Image
            src="/trackingbehaviorlogo2.png"
            alt="T"
            width={140}
            height={100}
            priority
          />
        </div>

        {/* navigation */}
        <nav className="bt-footer-nav">
          <h4 className="bt-footer-heading">Sections</h4>

          <ul className="bt-footer-links">
            <li>
              <Link href="#how-it-works">How&nbsp;It&nbsp;Works</Link>
            </li>
            <li>
              <Link href="#features">Features</Link>
            </li>
            <li>
              <Link href="#contact">Contact</Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}

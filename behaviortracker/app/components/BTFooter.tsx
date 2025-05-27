import Image from "next/image";
import Link from "next/link";
import "./BTFooter.css";

export default function BTFooter() {
  return (
    <footer className="bt-footer">
      <div className="bt-footer-inner">
        <div className="bt-footer-brand">
          <Image
            src="/trackingbehaviorlogo2.png"
            alt="T"
            width={140}
            height={100}
            priority
          />
        </div>

        <nav className="bt-footer-nav">
          <h4 className="bt-footer-heading">sections</h4>

          <ul className="bt-footer-links">
            <li>
              <Link href="#how-it-works">how&nbsp;it&nbsp;works</Link>
            </li>
            <li>
              <Link href="#features">features</Link>
            </li>
            <li>
              <Link href="#contact">ready to start</Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}

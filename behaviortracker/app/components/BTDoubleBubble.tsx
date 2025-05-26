import Image from "next/image";
import "./BTDoubleBubble.css";

export default function BTDoubleBubble() {
  return (
    <div className="double-bubble">
      <div className="bubble1">
        <div className="bubble profile">
          <Image
            src="/Milan.jpeg"
            alt="Milan Magyar"
            width={120}
            height={120}
            className="avatar"
            priority
          />

          <h3 className="name">milan magyar</h3>
          <p className="role">app creator</p>
        </div>
      </div>
      <div className="bubble2">
        <div className="bubble blurb">
          <p>
            track every <strong>social‑media</strong> session, get{" "}
            <strong>daily insights</strong>,<br />
            to reclaim your <strong>focus</strong> and
            <br />
            <strong>master productivity</strong>
          </p>

          <hr />

          <p>
            understand beyond <strong>numbers</strong> the{" "}
            <strong>context</strong> of your sessions
            <br />
            based on your <strong>beliefs on productivity</strong>
          </p>
        </div>
      </div>
    </div>
  );
}

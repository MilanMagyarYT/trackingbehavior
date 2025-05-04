import "./BTTextTitle2.css";
export default function BTTextTitle2({ text }: { text: string }) {
  return (
    <div className="bt-title2">
      <span className="bt-title2-text">{text}</span>
    </div>
  );
}

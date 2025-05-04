import "./BTTextTitle.css";
export default function BTTextTitle({ text }: { text: string }) {
  return (
    <div className="bt-title">
      <span className="bt-title-text">{text}</span>
    </div>
  );
}

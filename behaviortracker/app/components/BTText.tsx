import "./BTText.css";
export default function BTText({ text }: { text: string }) {
  return (
    <div className="bt-textt">
      <span className="bt-textt-text">{text}</span>
    </div>
  );
}

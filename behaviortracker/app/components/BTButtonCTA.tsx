import "./BTButtonCTA.css";
export default function BTButtonCTA({ text }: { text: string }) {
  return (
    <div className="bt-buttoncta">
      <span className="bt-buttoncta-text">{text}</span>
    </div>
  );
}

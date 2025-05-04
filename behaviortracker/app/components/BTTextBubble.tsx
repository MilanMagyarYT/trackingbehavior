import "./BTTextBubble.css";
export default function BTTextBubble({ text }: { text: string }) {
  return (
    <div className="bt-bubble-center">
      <span className="bt-bubble">{text}</span>
    </div>
  );
}

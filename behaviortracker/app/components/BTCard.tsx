import Image from "next/image";
import "./BTCard.css";

export default function BTCard({
  step,
  img,
  title,
  description,
}: {
  step: number;
  img: string;
  title: string;
  description: string;
}) {
  return (
    <div className="cards-wrapper">
      <article className="bt-step-card">
        <span className="bt-step-badge">{step}</span>

        <div className="bt-step-img">
          <Image src={img} alt={title} width={160} height={160} priority />
        </div>

        <h3 className="bt-step-title">{title}</h3>
        <p className="bt-step-desc">{description}</p>
      </article>
    </div>
  );
}

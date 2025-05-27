import "./BTTestimonial.css";
import { FaStar } from "react-icons/fa";

interface BTTestimonialProps {
  quote: string;
  caption: string;
}

export default function BTTestimonial({ quote, caption }: BTTestimonialProps) {
  return (
    <figure className="bt-testimonial">
      <div className="bt-stars">
        <FaStar />
        <FaStar />
        <FaStar />
        <FaStar />
        <FaStar />
      </div>
      <blockquote className="bt-quote">“{quote}”</blockquote>
      <figcaption className="bt-caption">{caption}</figcaption>
    </figure>
  );
}

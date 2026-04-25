import { useNavigate } from "react-router-dom";

export default function CardFooter({ onNext, loading, showBack, onBack }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  return (
    <div className="card-footer">
      <div className="school-identity">
        <img src="/iconlogoam.svg" alt="INSFP" className="school-logo-img" />
        <div>
          <div className="school-name-main">INSFP</div>
          <div className="school-name-sub">Institut National de Formation Supérieure Paramédicale</div>
        </div>
      </div>
      <div className="footer-btns">
        {showBack && (
          <button className="back-btn" onClick={handleBack}>←</button>
        )}
        <button className="next-btn" onClick={onNext} disabled={loading}>
          {loading ? "..." : "→"}
        </button>
      </div>
    </div>
  );
}
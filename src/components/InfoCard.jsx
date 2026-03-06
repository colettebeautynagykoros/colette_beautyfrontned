import "./InfoCard.css";
import virag from "../assets/virag.png";

const InfoCard = () => {
  return (
    <div className="info-card-wrapper">
      <div className="info-card">
        <p className="info-card__text">
          A gyantát minden esetben a vendég bőréhez és az adott terület igényeihez igazítom.
        </p>
      </div>

      {/* Virág a wrapper-ben van, nem a kártyában – nem növeli a card méretét */}
      <img
        src={virag}
        alt="flower decoration"
        className="info-card__flower"
      />
    </div>
  );
};

export default InfoCard;
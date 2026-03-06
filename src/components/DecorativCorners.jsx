import "./DecorativCorners.css";

const DecorativeCorners = ({ className = "" }) => {
  return (
    <>
      <span className={`decorative-corner top left ${className}`} />
      <span className={`decorative-corner top right ${className}`} />
      <span className={`decorative-corner bottom left ${className}`} />
      <span className={`decorative-corner bottom right ${className}`} />
    </>
  );
};

export default DecorativeCorners;

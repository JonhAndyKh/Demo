import type { CSSProperties } from "react";

const petals = Array.from({ length: 16 }, (_, index) => ({
  left: (index * 37 + 8) % 100,
  delay: -((index * 2.7) % 22),
  duration: 16 + (index % 5) * 2,
  size: 10 + (index % 4) * 2,
  drift: -34 + (index % 7) * 11,
  rotation: -35 + (index % 6) * 18,
}));

export function RomdoulPetalEffect() {
  const flowerSrc = `${import.meta.env.BASE_URL}romdoul-flower.png`;

  return (
    <div className="romdoul-petal-effect" aria-hidden="true">
      {petals.map((petal, index) => (
        <img
          key={index}
          src={flowerSrc}
          alt=""
          className="romdoul-petal"
          style={
            {
              "--petal-left": `${petal.left}%`,
              "--petal-delay": `${petal.delay}s`,
              "--petal-duration": `${petal.duration}s`,
              "--petal-size": `${petal.size}px`,
              "--petal-drift": `${petal.drift}px`,
              "--petal-rotation": `${petal.rotation}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
interface BrandMarkProps {
  size?: "sm" | "md" | "login";
  className?: string;
}

const sizeStyles = {
  sm: {
    logo: "h-12 w-[5.5rem]",
  },
  md: {
    logo: "h-12 w-[5.5rem]",
  },
  login: {
    logo: "h-16 w-[7rem]",
  },
} as const;

export function BrandMark({ size = "sm", className = "" }: BrandMarkProps) {
  const styles = sizeStyles[size];

  return (
    <span className={`flex items-center ${className}`}>
      <img
        src="/kizotopup-logo.png"
        alt="KizoTopup logo"
        className={`${styles.logo} shrink-0 object-contain`}
      />
    </span>
  );
}
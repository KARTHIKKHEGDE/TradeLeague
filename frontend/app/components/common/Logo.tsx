interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ size = 'md' }: LogoProps) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className={`${sizes[size]} bg-gradient-to-br from-[#1ABC9C] to-[#16a085] rounded-lg flex items-center justify-center font-bold text-white shadow-lg`}>
      <span className={size === 'sm' ? 'text-lg' : size === 'md' ? 'text-2xl' : 'text-3xl'}>
        TL
      </span>
    </div>
  );
}
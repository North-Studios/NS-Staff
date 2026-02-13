import { useState } from 'react';
import { motion } from 'framer-motion';

interface PolaroidFanProps {
  staffEndpoint: string;
  photoCount?: number;
}

export function PolaroidFan({ staffEndpoint, photoCount = 3 }: PolaroidFanProps) {
  const [isHovered, setIsHovered] = useState(false);

  const photos = Array.from({ length: photoCount }, (_, i) => i + 1);

  const getRotation = (index: number, total: number) => {
    if (!isHovered) {
      const baseRotations = [-10, 0, 10];
      return baseRotations[index] || 0;
    }
    const spread = 26;
    const center = (total - 1) / 2;
    return (index - center) * spread;
  };

  const getTranslateX = (index: number, total: number) => {
    if (!isHovered) return 0;
    const spacing = 170;
    const center = (total - 1) / 2;
    return (index - center) * spacing;
  };

  return (
    <div 
      className="relative w-full h-full flex items-center justify-center min-h-[400px] md:min-h-[600px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid="polaroid-fan"
    >
      {photos.map((photoNum, index) => (
        <motion.div
          key={photoNum}
          className="absolute w-64 md:w-80 cursor-pointer"
          initial={false}
          animate={{
            rotate: getRotation(index, photos.length),
            x: getTranslateX(index, photos.length),
            zIndex: isHovered
              ? index === Math.floor((photos.length - 1) / 2)
                ? photos.length + 1
                : photos.length - Math.abs(
                    index - Math.floor((photos.length - 1) / 2),
                  )
              : photos.length - index,
          }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
          style={{
            filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.3))',
          }}
          data-testid={`polaroid-${staffEndpoint}-${photoNum}`}
        >
          <div className="bg-white p-4 pb-16">
            <div className="aspect-square bg-card overflow-hidden">
              <img
                src={`/api/staff/${staffEndpoint}/photo/${photoNum}`}
                alt={`Photo ${photoNum}`}
                className="w-full h-full object-cover"
                data-testid={`img-staff-photo-${staffEndpoint}-${photoNum}`}
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

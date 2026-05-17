import {
  useState,
  type CSSProperties,
  type ImgHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { ZoomIn } from 'lucide-react';
import { ImageLightbox, type ImageLightboxVariant } from '@/components/ImageLightbox';
import { cn } from '@/lib/utils';

interface ZoomableImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  /** Use overlay button instead of clicking the image (for cards inside links). */
  zoomButton?: boolean;
  wrapperClassName?: string;
  variant?: ImageLightboxVariant;
}

export function ZoomableImage({
  src,
  alt = '',
  className,
  wrapperClassName,
  zoomButton = false,
  variant = 'plain',
  onClick,
  ...imgProps
}: ZoomableImageProps) {
  const [open, setOpen] = useState(false);

  if (!src) {
    return null;
  }

  const openLightbox = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setOpen(true);
  };

  const handleThumbClick = (e: MouseEvent<HTMLImageElement>) => {
    if (zoomButton) return;
    openLightbox(e);
    onClick?.(e);
  };

  return (
    <>
      <div className={cn('relative', wrapperClassName)}>
        <img
          src={src}
          alt={alt}
          className={cn(!zoomButton && 'cursor-zoom-in', className)}
          onClick={handleThumbClick}
          {...imgProps}
        />
        {zoomButton && (
          <button
            type="button"
            onClick={openLightbox}
            className="absolute right-2 top-2 rounded-md bg-black/50 p-1.5 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100 focus:opacity-100"
            aria-label="Open image"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        )}
      </div>
      <ImageLightbox
        src={src}
        alt={alt}
        open={open}
        onOpenChange={setOpen}
        variant={variant}
      />
    </>
  );
}

interface ZoomableBackgroundProps {
  src: string;
  alt?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  zoomButton?: boolean;
  testId?: string;
  variant?: ImageLightboxVariant;
}

export function ZoomableBackground({
  src,
  alt = '',
  className,
  style,
  children,
  zoomButton = false,
  testId,
  variant = 'plain',
}: ZoomableBackgroundProps) {
  const [open, setOpen] = useState(false);

  const openLightbox = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setOpen(true);
  };

  const backgroundStyle: CSSProperties = {
    ...style,
    backgroundImage: `url(${src})`,
  };

  return (
    <>
      <div
        className={cn('group relative', !zoomButton && 'cursor-zoom-in', className)}
        style={backgroundStyle}
        onClick={zoomButton ? undefined : openLightbox}
        data-testid={testId}
        role={zoomButton ? undefined : 'button'}
        tabIndex={zoomButton ? undefined : 0}
        onKeyDown={
          zoomButton
            ? undefined
            : (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setOpen(true);
                }
              }
        }
      >
        {children}
        {zoomButton && (
          <button
            type="button"
            onClick={openLightbox}
            className="absolute right-2 top-2 z-20 rounded-md bg-black/50 p-1.5 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100 focus:opacity-100"
            aria-label="Open image"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        )}
      </div>
      <ImageLightbox
        src={src}
        alt={alt}
        open={open}
        onOpenChange={setOpen}
        variant={variant}
      />
    </>
  );
}

'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

type EmblaCarouselType = NonNullable<UseEmblaCarouselType[1]>;
type EmblaOptionsType = Parameters<typeof useEmblaCarousel>[0];
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

// --- Helper Components (defined in-file) ---

type PropType<T extends React.ElementType> = React.ComponentPropsWithRef<T>;

// --- Dot Button ---
type UseDotButtonType = {
  selectedIndex: number;
  scrollSnaps: number[];
  onDotButtonClick: (index: number) => void;
};
const useDotButton = (emblaApi: EmblaCarouselType | undefined): UseDotButtonType => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onDotButtonClick = useCallback(
    (index: number) => {
      if (!emblaApi) return;
      emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  const onInit = useCallback((emblaApi: EmblaCarouselType) => {
    setScrollSnaps(emblaApi.scrollSnapList());
  }, []);

  const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    onInit(emblaApi);
    onSelect(emblaApi);
    emblaApi.on('reInit', onInit).on('reInit', onSelect).on('select', onSelect);
  }, [emblaApi, onInit, onSelect]);

  return { selectedIndex, scrollSnaps, onDotButtonClick };
};
const DotButton: React.FC<PropType<'button'>> = (props) => (
  <button type="button" {...props} />
);

// --- Prev/Next Buttons ---
type UsePrevNextButtonsType = {
  prevBtnDisabled: boolean;
  nextBtnDisabled: boolean;
  onPrevButtonClick: () => void;
  onNextButtonClick: () => void;
};
const usePrevNextButtons = (
  emblaApi: EmblaCarouselType | undefined
): UsePrevNextButtonsType => {
  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);

  const onPrevButtonClick = useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollPrev();
  }, [emblaApi]);

  const onNextButtonClick = useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
    setPrevBtnDisabled(!emblaApi.canScrollPrev());
    setNextBtnDisabled(!emblaApi.canScrollNext());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect(emblaApi);
    emblaApi.on('reInit', onSelect).on('select', onSelect);
  }, [emblaApi, onSelect]);

  return {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  };
};

const PrevButton: React.FC<PropType<typeof Button>> = (props) => (
  <Button
    variant="ghost"
    size="icon"
    className="absolute top-1/2 left-2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/50 hover:bg-background/80"
    {...props}
  >
    <ChevronLeft className="h-5 w-5" />
  </Button>
);

const NextButton: React.FC<PropType<typeof Button>> = (props) => (
  <Button
    variant="ghost"
    size="icon"
    className="absolute top-1/2 right-2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/50 hover:bg-background/80"
    {...props}
  >
    <ChevronRight className="h-5 w-5" />
  </Button>
);


// --- Main Carousel Component ---

type ImageInfo = {
  src: string;
  alt: string;
  hint: string;
};

type ImageFaderProps = {
  images: ImageInfo[];
  className?: string;
};

const OPTIONS: EmblaOptionsType = { loop: true };

export function ImageFader({ images, className }: ImageFaderProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel(OPTIONS, [
    Autoplay({ playOnInit: true, delay: 3000, stopOnInteraction: false }),
  ]);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewImageIndex, setPreviewImageIndex] = useState<number | null>(null);

  const { selectedIndex, scrollSnaps, onDotButtonClick } = useDotButton(emblaApi);
  const { prevBtnDisabled, nextBtnDisabled, onPrevButtonClick, onNextButtonClick } =
    usePrevNextButtons(emblaApi);
  
  if (!images || images.length === 0) {
    return null;
  }
  
  const hasMultipleImages = images.length > 1;
  
  const handleImageClick = (index: number) => {
    setPreviewImageIndex(index);
    setDialogOpen(true);
  };

  const handlePreviewNext = () => {
    if (previewImageIndex === null) return;
    const nextIndex = (previewImageIndex + 1) % images.length;
    setPreviewImageIndex(nextIndex);
  };

  const handlePreviewPrev = () => {
    if (previewImageIndex === null) return;
    const prevIndex = (previewImageIndex - 1 + images.length) % images.length;
    setPreviewImageIndex(prevIndex);
  };

  const previewImage = previewImageIndex !== null ? images[previewImageIndex] : null;

  return (
    <>
      <div className={cn("w-full", className)}>
        <div className="relative overflow-hidden rounded-lg group">
          <div ref={emblaRef} className="overflow-hidden">
            <div className="flex">
              {images.map((image, index) => (
                <div 
                  className="relative flex-shrink-0 flex-grow-0 basis-full h-48 cursor-pointer" 
                  key={index}
                  onClick={() => handleImageClick(index)}
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    data-ai-hint={image.hint}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              ))}
            </div>
          </div>
          
          {hasMultipleImages && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <PrevButton onClick={onPrevButtonClick} disabled={prevBtnDisabled} />
              <NextButton onClick={onNextButtonClick} disabled={nextBtnDisabled} />
            </div>
          )}
        </div>

        {hasMultipleImages && (
          <div className="flex justify-center items-center gap-2 pt-4">
            {scrollSnaps.map((_, index) => (
              <DotButton
                key={index}
                onClick={() => onDotButtonClick(index)}
                className={cn(
                  'h-2 w-2 rounded-full transition-all duration-300',
                  'bg-[hsl(var(--primary)/0.4)]',
                  index === selectedIndex ? 'w-4 bg-[hsl(var(--primary))]' : 'hover:bg-[hsl(var(--primary)/0.7)]'
                )}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          {previewImage && (
            <>
               <DialogHeader className="sr-only">
                <DialogTitle>Image Preview: {previewImage.alt}</DialogTitle>
                <DialogDescription>A larger view of the image: {previewImage.alt}</DialogDescription>
              </DialogHeader>
              <div className="relative mt-4">
                 {hasMultipleImages && (
                   <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1/2 left-0 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-background/60 hover:bg-background/90"
                    onClick={handlePreviewPrev}
                  >
                    <ChevronLeft className="h-6 w-6" />
                    <span className="sr-only">Previous Image</span>
                  </Button>
                )}
                <Image 
                  src={previewImage.src} 
                  alt={previewImage.alt} 
                  width={1200} 
                  height={800} 
                  className="rounded-lg object-contain w-full h-auto max-h-[75vh]" 
                />
                {hasMultipleImages && (
                   <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1/2 right-0 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-background/60 hover:bg-background/90"
                    onClick={handlePreviewNext}
                  >
                    <ChevronRight className="h-6 w-6" />
                    <span className="sr-only">Next Image</span>
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

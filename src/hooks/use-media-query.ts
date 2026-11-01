
'use client';

import { useState, useEffect } from 'react';

export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Ensure window is defined (for server-side rendering)
    if (typeof window === 'undefined') {
      return;
    }

    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    
    const listener = () => {
      setMatches(media.matches);
    };

    // Add listener
    media.addEventListener('change', listener);
    
    // Cleanup listener on component unmount
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
};

'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { cn } from '@/lib/utils';

interface AudioPlayerProps {
  src: string | null;
  duration?: number | null;
  className?: string;
}

export function AudioPlayer({ src, duration, className }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 1); // Avoid division by zero
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Handle playback and source changes robustly
  // We move the play logic to togglePlay to satisfy Chrome's User Activation requirement.
  useEffect(() => {
    return () => {
      if (audioRef.current) {
          audioRef.current.pause();
      }
    };
  }, [src]);

  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.volume = volume;
    }
  }, [volume]);

  // Handle source changes separately to reset progress
  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(false);
    setAudioError(null);
    if (audioRef.current) {
        audioRef.current.load(); // Force browser to re-check the source
    }
  }, [src]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      
      const d = audioRef.current.duration;
      // If we have a valid duration from the browser, sync it
      if (d && d !== Infinity && !isNaN(d) && Math.abs(d - totalDuration) > 1) {
          setTotalDuration(d);
      } 
      // If we have a duration from props but browser says Infinity, use props
      else if (duration && (d === Infinity || isNaN(d)) && totalDuration !== duration) {
          setTotalDuration(duration);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const d = audioRef.current.duration;
      if (d && d !== Infinity && !isNaN(d)) {
          setTotalDuration(d);
      } else if (duration) {
          setTotalDuration(duration);
      }
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || time === Infinity) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlay = async () => {
      const audio = audioRef.current;
      if (!audio || !src) return;

      if (audioError) {
          handleRetry();
          return;
      }

      try {
          if (isPlaying) {
              audio.pause();
              setIsPlaying(false);
          } else {
              const playPromise = audio.play();
              if (playPromise !== undefined) {
                  await playPromise;
                  setIsPlaying(true);
              }
          }
      } catch (err: any) {
          if (err.name !== 'AbortError') {
              console.error("Playback interaction error:", err);
              setIsPlaying(false);
          }
      }
  };
  
  const reset = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  const handleAudioError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
      const target = e.target as HTMLAudioElement;
      const error = target.error;
      
      let errorMessage = "Playback Error";
      let technicalDetails = "Unknown error";

      if (error) {
          switch (error.code) {
              case 1: 
                  errorMessage = "Playback Aborted";
                  technicalDetails = "The fetching process for the media resource was aborted by the user agent at the user's request.";
                  break;
              case 2:
                  errorMessage = "Network Error";
                  technicalDetails = "A network error occurred while fetching the media resource.";
                  break;
              case 3:
                  errorMessage = "Decoding Error";
                  technicalDetails = "An error occurred while decoding the media resource.";
                  break;
              case 4:
                  errorMessage = "Source Not Supported";
                  technicalDetails = "The media resource could not be loaded, either because the server or network failed or because the format is not supported.";
                  break;
          }
          technicalDetails = error.message || technicalDetails;
      }

      // VITAL FIX: Use separate arguments for console.error to prevent object-masking/CORS-redaction in logs.
      // Also logging basic state bits that are almost always accessible.
      console.error("Audio Playback Failed!");
      console.error("- Error Code:", error?.code || 'null');
      console.error("- Error Message:", error?.message || 'null');
      console.error("- Audio Source:", target.src || 'null');
      console.error("- Ready State:", target.readyState);
      console.error("- Network State:", target.networkState);
      
      if (!target.src || target.src === window.location.href) {
          console.error("- CRITICAL: Audio source is invalid or pointing to the current page URL.");
      }

      setAudioError(errorMessage);
      setIsPlaying(false);
  };

  const handleRetry = () => {
      setAudioError(null);
      if (audioRef.current) {
          audioRef.current.load();
      }
  };

  if (!src) return null;

  return (
    <div className={cn("flex flex-col gap-3 w-full", className)}>
      <audio
        key={src}
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onError={handleAudioError}
        onWaiting={() => console.warn("Audio Buffering: Waiting for data...")}
        onStalled={() => console.error("Audio Stalled: Connection lost or server slow.")}
        preload="auto"
        playsInline
        className="hidden"
      />
      
      <div className={cn(
          "flex items-center gap-4 bg-background/40 backdrop-blur-md border rounded-full px-5 py-3 shadow-lg transition-all group",
          audioError ? "border-destructive/40 bg-destructive/5" : "border-primary/20 hover:border-primary/40"
      )}>
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePlay}
          className={cn(
              "h-10 w-10 shrink-0 rounded-full text-primary-foreground transform active:scale-95 transition-all shadow-md",
              audioError ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"
          )}
        >
          {audioError ? (
              <RefreshCcw className="h-5 w-5" />
          ) : (
              isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current ml-0.5" />
          )}
        </Button>

        <div className="flex-grow space-y-1.5 min-w-0">
          {audioError ? (
              <div className="flex items-center gap-2 text-destructive animate-in fade-in slide-in-from-left-2">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{audioError}</span>
                  <button onClick={handleRetry} className="text-[10px] underline font-bold uppercase tracking-wider hover:opacity-80">Retry</button>
              </div>
          ) : (
              <Slider
                value={[currentTime]}
                max={totalDuration || 1}
                step={0.1}
                onValueChange={handleSeek}
                className="cursor-pointer"
              />
          )}
          <div className="flex justify-between items-center text-[10px] font-mono font-bold text-muted-foreground tabular-nums tracking-tighter">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(totalDuration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 border-l border-primary/10 pl-3 shrink-0">
             <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)} className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors">
                {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
             </Button>
             <Button variant="ghost" size="icon" onClick={reset} className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors">
                <RotateCcw className="h-4 w-4" />
             </Button>
        </div>
      </div>
    </div>
  );
}


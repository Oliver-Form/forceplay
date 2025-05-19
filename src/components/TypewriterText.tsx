import { useEffect, useState } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}

export default function TypewriterText({ text, speed = 50, className = '', onComplete }: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let isCancelled = false;
    let timeout: ReturnType<typeof setTimeout>;
    // reset display and handle empty text
    setDisplayedText('');
    if (text === '') {
      onComplete?.();
      return;
    }
    let current = 0;
    const tick = () => {
      if (isCancelled) return;
      current++;
      // always slice to avoid stale char concatenation
      setDisplayedText(text.slice(0, current));
      if (current < text.length) {
        timeout = setTimeout(tick, speed);
      } else {
        onComplete?.();
      }
    };
    timeout = setTimeout(tick, speed);
    return () => {
      isCancelled = true;
      clearTimeout(timeout);
    };
  }, [text, speed, onComplete]);

  return (
    <div className={className}>
      {displayedText}
    </div>
  );
}

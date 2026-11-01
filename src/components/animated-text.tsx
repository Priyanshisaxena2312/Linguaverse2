'use client';

import { motion, Variants } from 'framer-motion';

type AnimatedUnderlineTextProps = {
  text: string;
  el?: keyof React.JSX.IntrinsicElements;
  className?: string;
  triggerOnLoad?: boolean;
};

export function AnimatedUnderlineText({
  text,
  el: Wrapper = 'h2',
  className,
  triggerOnLoad = false,
}: AnimatedUnderlineTextProps) {
    
  const animationProps = triggerOnLoad 
    ? { animate: "hover", initial:"initial" } 
    : { whileInView: "hover", initial:"initial", viewport: { once: true, amount: 0.8 } };

  return (
    <Wrapper className={className}>
      <motion.span 
        className="inline-block relative" 
        {...animationProps}
      >
        {text}
        <motion.span
          className="absolute -bottom-1 left-0 w-full h-1 bg-primary/40"
          style={{ transformOrigin: 'left' }}
          variants={{
            initial: { scaleX: 0 },
            hover: { scaleX: 1 },
          }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        ></motion.span>
      </motion.span>
    </Wrapper>
  );
}

type TypewriterTextProps = {
  text: string;
  el?: keyof React.JSX.IntrinsicElements;
  className?: string;
  triggerOnLoad?: boolean;
};

export function TypewriterText({ text, el: Wrapper = 'p', className, triggerOnLoad = false }: TypewriterTextProps) {
  const words = text.split(" ");

  const container: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: triggerOnLoad ? 0.8 : 0.1 },
    },
  };

  const child: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'tween', ease: 'easeOut', duration: 0.5 },
    },
  };

  const animationProps = triggerOnLoad 
    ? { animate: "visible" } 
    : { whileInView: "visible", viewport: { once: true, amount: 0.6 } };

  return (
    <Wrapper className={className}>
      <motion.span
        variants={container}
        initial="hidden"
        {...animationProps}
        aria-label={text}
      >
        {words.map((word, index) => (
          <motion.span key={index} variants={child} className="inline-block mr-[0.25em]">
            {word}
          </motion.span>
        ))}
      </motion.span>
    </Wrapper>
  );
}

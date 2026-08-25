import React from 'react';

const TextAnimate = ({
  children,
  as: Component = 'span',
  className = '',
  delay = 0.12,
  stagger = 0.08,
  ...props
}) => {
  const text = String(children ?? '');
  const words = text.split(' ');

  return (
    <Component
      className={`text-animate-spotlight ${className}`.trim()}
      aria-label={text}
      {...props}
    >
      {words.map((word, wordIndex) => (
        <React.Fragment key={`${word}-${wordIndex}`}>
          <span
            className="text-animate-word"
            aria-hidden="true"
            style={{ animationDelay: `${delay + wordIndex * stagger}s` }}
          >
            <span className="text-animate-word-inner">{word}</span>
          </span>
          {wordIndex < words.length - 1 ? ' ' : null}
        </React.Fragment>
      ))}
    </Component>
  );
};

export default TextAnimate;

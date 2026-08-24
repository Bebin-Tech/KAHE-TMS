import React from 'react';

const TextAnimate = ({
  children,
  as: Component = 'span',
  className = '',
  delay = 0.12,
  stagger = 0.025,
  ...props
}) => {
  const text = String(children ?? '');
  let index = 0;

  return (
    <Component
      className={`text-animate-blur-up ${className}`.trim()}
      aria-label={text}
      {...props}
    >
      {text.split(' ').map((word, wordIndex, words) => (
        <React.Fragment key={`${word}-${wordIndex}`}>
          <span className="text-animate-word" aria-hidden="true">
            {[...word].map((character) => {
              const characterIndex = index;
              index += 1;

              return (
                <span
                  className="text-animate-character"
                  style={{ animationDelay: `${delay + characterIndex * stagger}s` }}
                  key={`${character}-${characterIndex}`}
                >
                  {character}
                </span>
              );
            })}
          </span>
          {wordIndex < words.length - 1 ? ' ' : null}
        </React.Fragment>
      ))}
    </Component>
  );
};

export default TextAnimate;

import React from 'react';
import { Button, forwardRef } from '@chakra-ui/react';

/**
 * Enhanced Button component with animations
 */
const AnimatedButton = forwardRef(({ 
  children, 
  variant = 'primary',
  animation = 'none',
  loadingText,
  ...props 
}, ref) => {
  // Determine animation class
  let animationClass = '';
  switch (animation) {
    case 'pulse':
      animationClass = 'btn-pulse';
      break;
    case 'float':
      animationClass = 'hover-float';
      break;
    case 'ripple':
      animationClass = 'btn-ripple';
      break;
    default:
      animationClass = '';
  }

  // Determine the variant used for styling
  const buttonVariant = variant === 'glass' 
    ? 'glass' 
    : variant === 'primary' || variant === 'secondary' || variant === 'accent' || variant === 'success' 
      ? variant 
      : undefined;

  return (
    <Button
      ref={ref}
      variant={buttonVariant}
      className={animationClass}
      transform="auto"
      transition="all 0.3s"
      _hover={{ 
        transform: 'translateY(-2px)', 
        boxShadow: 'md',
      }}
      _active={{ 
        transform: 'translateY(0)', 
      }}
      fontWeight="medium"
      loadingText={loadingText || "Loading..."}
      {...props}
    >
      {children}
    </Button>
  );
});

AnimatedButton.displayName = 'AnimatedButton';

export default AnimatedButton; 
import React from 'react';
import { Box, useColorModeValue } from '@chakra-ui/react';

/**
 * Enhanced Card component with glassmorphism effects
 */
const Card = ({ 
  children, 
  variant = 'default', 
  isHoverable = false, 
  isAnimated = false,
  ...props 
}) => {
  // Determine the appropriate class based on variant
  let cardClass = 'glass-card';
  if (variant === 'solid') cardClass = '';
  if (variant === 'neumorph') cardClass = 'neumorph';
  
  // Add hover animation class if hoverable
  if (isHoverable) cardClass += ' hover-float';
  
  // Add animation class if animated
  const animationClass = isAnimated ? 'fade-in' : '';
  
  return (
    <Box
      className={`${cardClass} ${animationClass}`}
      bg={variant === 'solid' ? useColorModeValue('white', 'gray.800') : undefined}
      borderRadius="xl"
      overflow="hidden"
      boxShadow={variant === 'solid' ? 'md' : undefined}
      transition="all 0.3s ease"
      {...props}
    >
      {children}
    </Box>
  );
};

export default Card; 
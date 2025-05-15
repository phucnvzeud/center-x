import React from 'react';
import { Box, useColorModeValue } from '@chakra-ui/react';

/**
 * Enhanced CardBody component
 */
const CardBody = ({ 
  children, 
  variant = 'default',
  hasAnimation = false,
  ...props 
}) => {
  // Determine styling based on variant
  const getPadding = () => {
    if (variant === 'compact') return 4;
    if (variant === 'spacious') return 8;
    return 6; // default padding
  };

  const padding = getPadding();
  const bgColor = useColorModeValue('white', 'gray.800');
  const animationClass = hasAnimation ? 'fade-in' : '';

  return (
    <Box
      p={padding}
      bg={variant === 'transparent' ? 'transparent' : bgColor}
      className={animationClass}
      {...props}
    >
      {children}
    </Box>
  );
};

export default CardBody; 
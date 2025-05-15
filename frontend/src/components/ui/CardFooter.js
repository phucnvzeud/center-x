import React from 'react';
import { Box, Flex, useColorModeValue } from '@chakra-ui/react';

/**
 * Enhanced CardFooter component
 */
const CardFooter = ({ 
  children, 
  variant = 'default',
  align = 'space-between',
  borderTop = true,
  ...props 
}) => {
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  return (
    <Box
      py={4}
      px={6}
      bg={variant === 'transparent' ? 'transparent' : bgColor}
      borderTopWidth={borderTop ? '1px' : 0}
      borderColor={borderColor}
      {...props}
    >
      {typeof children === 'object' && React.Children.count(children) > 1 ? (
        <Flex justify={align} align="center" wrap="wrap">
          {children}
        </Flex>
      ) : (
        children
      )}
    </Box>
  );
};

export default CardFooter; 
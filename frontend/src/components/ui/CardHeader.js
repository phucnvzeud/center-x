import React from 'react';
import { Box, Flex, Heading, useColorModeValue } from '@chakra-ui/react';

/**
 * Enhanced CardHeader component with gradient effects
 */
const CardHeader = ({ 
  children, 
  title,
  icon,
  variant = 'default',
  actions,
  ...props 
}) => {
  // Determine the style based on variant
  const getHeaderStyle = () => {
    switch (variant) {
      case 'gradient':
        return {
          className: 'bg-gradient-primary',
          color: 'white',
        };
      case 'accent':
        return {
          className: 'bg-gradient-accent',
          color: 'white',
        };
      case 'success':
        return {
          className: 'bg-gradient-success',
          color: 'white',
        };
      case 'transparent':
        return {
          bg: 'transparent',
          color: useColorModeValue('gray.800', 'white'),
        };
      default:
        return {
          bg: useColorModeValue('gray.50', 'gray.700'),
          color: useColorModeValue('gray.800', 'white'),
        };
    }
  };

  const headerStyle = getHeaderStyle();
  
  // If we have a title prop, render our standard header
  if (title) {
    return (
      <Box
        py={4}
        px={6}
        {...headerStyle}
        {...props}
      >
        <Flex justify="space-between" align="center">
          <Flex align="center">
            {icon && <Box mr={2}>{icon}</Box>}
            <Heading size="md">{title}</Heading>
          </Flex>
          {actions && <Box>{actions}</Box>}
        </Flex>
      </Box>
    );
  }
  
  // Otherwise, just render the children
  return (
    <Box
      py={4}
      px={6}
      {...headerStyle}
      {...props}
    >
      {children}
    </Box>
  );
};

export default CardHeader; 
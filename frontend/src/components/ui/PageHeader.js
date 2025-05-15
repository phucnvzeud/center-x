import React from 'react';
import { Box, Heading, Text, Flex, HStack, useColorModeValue } from '@chakra-ui/react';

/**
 * Enhanced PageHeader component for consistent page headers
 */
const PageHeader = ({ 
  title, 
  subtitle, 
  icon,
  actions,
  breadcrumbs,
  variant = 'default', 
  ...props 
}) => {
  const getBgStyle = () => {
    switch (variant) {
      case 'gradient':
        return {
          className: 'bg-gradient-primary',
          color: 'white',
          mb: 6,
          p: 6,
          borderRadius: 'lg',
        };
      case 'glass':
        return {
          className: 'glass-card',
          mb: 6,
          p: 6,
        };
      case 'minimal':
        return {
          mb: 4,
          pb: 4,
          borderBottomWidth: '1px',
          borderBottomColor: useColorModeValue('gray.200', 'gray.700'),
        };
      default:
        return {
          mb: 6,
        };
    }
  };

  const bgStyle = getBgStyle();
  const titleColor = variant === 'default' ? 'brand.600' : undefined;
  const subtitleColor = variant === 'default' ? 'gray.500' : undefined;

  return (
    <Box {...bgStyle} {...props}>
      {breadcrumbs && (
        <Box mb={4} opacity={0.8} fontSize="sm">
          {breadcrumbs}
        </Box>
      )}
      
      <Flex 
        direction={{ base: 'column', md: 'row' }} 
        justify="space-between" 
        align={{ base: 'flex-start', md: 'center' }}
      >
        <Box mb={{ base: 4, md: 0 }}>
          <Flex align="center">
            {icon && (
              <Box
                mr={3}
                fontSize="2xl"
                data-aos="fade-right"
                data-aos-delay="100"
              >
                {icon}
              </Box>
            )}
            <Box>
              <Heading 
                as="h1" 
                size="xl" 
                color={titleColor}
                data-aos="fade-up"
                fontWeight="bold"
                className={variant === 'default' ? 'text-gradient-primary' : undefined}
              >
                {title}
              </Heading>
              {subtitle && (
                <Text 
                  fontSize="lg" 
                  color={subtitleColor} 
                  mt={1}
                  data-aos="fade-up" 
                  data-aos-delay="100"
                >
                  {subtitle}
                </Text>
              )}
            </Box>
          </Flex>
        </Box>
        
        {actions && (
          <HStack spacing={4} data-aos="fade-left">
            {actions}
          </HStack>
        )}
      </Flex>
    </Box>
  );
};

export default PageHeader; 
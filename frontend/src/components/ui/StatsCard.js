import React from 'react';
import { Box, Stat, StatLabel, StatNumber, StatHelpText, StatArrow, Flex, Icon, useColorModeValue } from '@chakra-ui/react';

/**
 * Enhanced Stats Card for displaying metrics
 */
const StatsCard = ({
  title,
  value,
  icon,
  helpText,
  changeType,
  changeValue,
  variant = 'default',
  ...props
}) => {
  // Determine the background and other styles based on variant
  const getCardStyle = () => {
    switch (variant) {
      case 'gradient':
        return {
          className: 'bg-gradient-primary',
          color: 'white',
        };
      case 'glass':
        return {
          className: 'glass-card hover-float',
        };
      case 'success':
        return {
          className: 'bg-gradient-success',
          color: 'white',
        };
      case 'accent':
        return {
          className: 'bg-gradient-accent',
          color: 'white',
        };
      default:
        return {
          bg: useColorModeValue('white', 'gray.800'),
          boxShadow: 'md',
          borderRadius: 'lg',
        };
    }
  };

  const cardStyle = getCardStyle();
  
  // Text colors when not using gradient backgrounds
  const labelColor = variant === 'default' ? useColorModeValue('gray.600', 'gray.400') : undefined;
  const numberColor = variant === 'default' ? useColorModeValue('gray.900', 'white') : undefined;
  
  return (
    <Box
      p={5}
      borderRadius="lg"
      overflow="hidden"
      transition="all 0.3s ease"
      _hover={{
        transform: variant === 'glass' ? undefined : 'translateY(-5px)',
        boxShadow: variant === 'glass' ? undefined : 'lg',
      }}
      data-aos="fade-up"
      {...cardStyle}
      {...props}
    >
      <Flex justify="space-between" align="center">
        <Stat>
          <StatLabel color={labelColor} fontSize="sm" fontWeight="medium">
            {title}
          </StatLabel>
          <StatNumber fontSize="2xl" fontWeight="bold" color={numberColor} my={2}>
            {value}
          </StatNumber>
          {(helpText || changeType) && (
            <StatHelpText mb={0}>
              {changeType && (
                <>
                  <StatArrow type={changeType} />
                  {changeValue}
                </>
              )}
              {helpText && !changeType && helpText}
            </StatHelpText>
          )}
        </Stat>
        {icon && (
          <Box
            p={3}
            borderRadius="full"
            bg={variant === 'default' ? useColorModeValue('brand.50', 'gray.700') : 'rgba(255, 255, 255, 0.2)'}
            color={variant === 'default' ? useColorModeValue('brand.500', 'brand.200') : 'white'}
            fontSize="xl"
          >
            <Icon as={icon} boxSize={6} />
          </Box>
        )}
      </Flex>
    </Box>
  );
};

export default StatsCard; 
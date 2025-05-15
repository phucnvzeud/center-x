import React, { useEffect } from 'react';
import { ChakraProvider as ChakraUIProvider } from '@chakra-ui/react';
import theme from './theme';
import AOS from 'aos';
import 'aos/dist/aos.css';

const ChakraProvider = ({ children }) => {
  useEffect(() => {
    // Initialize AOS animation library
    AOS.init({
      duration: 800,
      easing: 'ease-out-cubic',
      once: false,
      mirror: true,
    });
  }, []);

  return (
    <ChakraUIProvider theme={theme}>
      {children}
    </ChakraUIProvider>
  );
};

export default ChakraProvider; 
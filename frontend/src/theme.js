import { extendTheme } from '@chakra-ui/react';
import '@fontsource/poppins';
import '@fontsource/inter';

const theme = extendTheme({
  colors: {
    brand: {
      50: '#e6f1ff',
      100: '#c2dbff',
      200: '#9bc3ff',
      300: '#74abff',
      400: '#4d93ff',
      500: '#2979ff', // primary brand color
      600: '#1e60cc',
      700: '#154899',
      800: '#0d3066',
      900: '#061833',
    },
    accent: {
      50: '#ffe9e9',
      100: '#ffc7c7',
      200: '#ffa5a5',
      300: '#ff8383',
      400: '#ff6161',
      500: '#ff3f3f', // accent color
      600: '#cc3232',
      700: '#992626',
      800: '#661919',
      900: '#330d0d',
    },
    success: {
      50: '#e6fbf0',
      100: '#c2f5db',
      200: '#9eefc6',
      300: '#7ae9b1',
      400: '#56e39c',
      500: '#32dd87', // success color
      600: '#28b16c',
      700: '#1e8551',
      800: '#145836',
      900: '#0a2c1b',
    },
  },
  fonts: {
    heading: "'Poppins', sans-serif",
    body: "'Inter', sans-serif",
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.800',
      },
      '.glass-card': {
        background: 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        transition: 'all 0.3s ease-in-out',
      },
      '.glass-card:hover': {
        transform: 'translateY(-5px)',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.15)',
      },
      '.animate-pulse': {
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      '@keyframes pulse': {
        '0%, 100%': {
          opacity: 1,
        },
        '50%': {
          opacity: 0.7,
        },
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'semibold',
        borderRadius: 'lg',
        transition: 'all 0.2s',
      },
      variants: {
        primary: {
          bg: 'brand.500',
          color: 'white',
          _hover: {
            bg: 'brand.600',
            transform: 'translateY(-2px)',
            boxShadow: 'lg',
          },
          _active: {
            bg: 'brand.700',
            transform: 'translateY(0)',
          },
        },
        accent: {
          bg: 'accent.500',
          color: 'white',
          _hover: {
            bg: 'accent.600',
            transform: 'translateY(-2px)',
            boxShadow: 'lg',
          },
        },
        success: {
          bg: 'success.500',
          color: 'white',
          _hover: {
            bg: 'success.600',
            transform: 'translateY(-2px)',
            boxShadow: 'lg',
          },
        },
        'glass': {
          bg: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          color: 'gray.800',
          _hover: {
            bg: 'rgba(255, 255, 255, 0.25)',
            transform: 'translateY(-2px)',
            boxShadow: 'lg',
          },
        },
      },
    },
    Badge: {
      baseStyle: {
        borderRadius: 'full',
        px: 3,
        py: 1,
        fontWeight: 'medium',
      },
      variants: {
        solid: props => ({
          bg: `${props.colorScheme}.500`,
          color: 'white',
        }),
        subtle: props => ({
          bg: `${props.colorScheme}.100`,
          color: `${props.colorScheme}.800`,
        }),
        outline: props => ({
          color: `${props.colorScheme}.500`,
          boxShadow: `inset 0 0 0px 1px ${props.colorScheme}.500`,
        }),
        'glass': {
          bg: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(8px)',
          color: 'gray.800',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    Box: {
      variants: {
        'card': {
          bg: 'white',
          borderRadius: 'xl',
          boxShadow: 'md',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          _hover: {
            boxShadow: 'lg',
            transform: 'translateY(-3px)',
          },
        },
        'glass': {
          bg: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(10px)',
          borderRadius: 'xl',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          transition: 'all 0.3s ease',
          _hover: {
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
  },
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
});

export default theme; 
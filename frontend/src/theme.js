import { extendTheme } from '@chakra-ui/react';
import '@fontsource/inter';

const theme = extendTheme({
  colors: {
    brand: {
      50: '#f5f0ff',
      100: '#ede0ff',
      200: '#d6bfff',
      300: '#b794f6',
      400: '#9f7aea',
      500: '#805ad5', // primary brand color (purple)
      600: '#6b46c1',
      700: '#553c9a',
      800: '#44337a',
      900: '#322659',
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
  },
  fonts: {
    heading: "'Inter', sans-serif",
    body: "'Inter', sans-serif",
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.800',
      },
      '.chakra-select__menu': {
        borderRadius: '0 !important',
      },
      '.chakra-select__menu-list': {
        borderRadius: '0 !important',
      },
      '.chakra-select__option': {
        borderRadius: '0 !important',
      },
      '[role=menu]': {
        borderRadius: '0 !important',
      },
      '[role=listbox]': {
        borderRadius: '0 !important',
      },
      '[role=menuitem]': {
        borderRadius: '0 !important',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'medium',
        borderRadius: '0',
        transition: 'all 0.2s',
      },
      variants: {
        primary: {
          bg: 'brand.500',
          color: 'white',
          _hover: {
            bg: 'brand.600',
          },
          _active: {
            bg: 'brand.700',
          },
        },
        outline: {
          border: '1px solid',
          borderColor: 'gray.200',
          color: 'gray.700',
          _hover: {
            bg: 'gray.50',
          },
        },
        ghost: {
          color: 'gray.600',
          _hover: {
            bg: 'gray.100',
          },
        },
      },
    },
    Badge: {
      baseStyle: {
        borderRadius: '0',
        px: 2,
        py: 1,
        fontWeight: 'medium',
        fontSize: 'xs',
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
      },
    },
    Box: {
      variants: {
        'card': {
          bg: 'white',
          borderRadius: '0',
          boxShadow: 'sm',
          borderWidth: '1px',
          borderColor: 'gray.200',
          overflow: 'hidden',
        },
        'sidebar': {
          bg: 'white',
          borderRightWidth: '1px',
          borderColor: 'gray.200',
          height: '100%',
          },
        },
    },
    Table: {
      variants: {
        simple: {
          th: {
            borderBottom: '1px',
            borderColor: 'gray.200',
            textTransform: 'none',
            letterSpacing: 'normal',
            fontWeight: 'medium',
            fontSize: 'sm',
          },
          td: {
            borderBottom: '1px',
            borderColor: 'gray.200',
          },
        },
      },
    },
    Input: {
      baseStyle: {
        field: {
          borderRadius: '0',
        },
      },
    },
    Select: {
      baseStyle: {
        field: {
          borderRadius: '0',
        },
        icon: {
          borderRadius: '0',
        }
      },
      variants: {
        outline: {
          field: {
            borderRadius: '0',
          },
          menu: {
            borderRadius: '0',
          },
          menuList: {
            borderRadius: '0',
          },
          option: {
            borderRadius: '0',
          }
        },
        filled: {
          field: {
            borderRadius: '0',
          },
          menu: {
            borderRadius: '0',
          },
          menuList: {
            borderRadius: '0',
          },
          option: {
            borderRadius: '0',
          }
        },
        flushed: {
          field: {
            borderRadius: '0',
          },
          menu: {
            borderRadius: '0',
          },
          menuList: {
            borderRadius: '0',
          },
          option: {
            borderRadius: '0',
          }
      },
      }
    },
    Textarea: {
      baseStyle: {
        borderRadius: '0',
      },
    },
    Modal: {
      baseStyle: {
        dialog: {
          borderRadius: '0',
        },
      },
    },
    Popover: {
      baseStyle: {
        content: {
          borderRadius: '0',
        },
      },
    },
    Tooltip: {
      baseStyle: {
        borderRadius: '0',
      },
    },
    Menu: {
      baseStyle: {
        button: {
          borderRadius: '0',
        },
        list: {
          borderRadius: '0',
          padding: '0',
          border: '1px solid',
          borderColor: 'gray.200',
        },
        item: {
          borderRadius: '0',
        },
      },
    },
    Tabs: {
      baseStyle: {
        tab: {
          borderRadius: '0',
        },
      },
    },
  },
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  radii: {
    none: '0',
    sm: '0',
    md: '0',
    lg: '0',
    xl: '0',
    '2xl': '0',
    full: '0',
  },
});

export default theme; 
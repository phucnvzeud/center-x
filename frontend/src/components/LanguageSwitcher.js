import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Box,
  Text,
  Flex,
  Icon
} from '@chakra-ui/react';
import { FaGlobe, FaCheck } from 'react-icons/fa';

const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <Menu>
      <MenuButton 
        as={Button} 
        variant="ghost" 
        size="sm" 
        rightIcon={<FaGlobe />}
        _hover={{ bg: 'gray.100' }}
      >
        {currentLanguage === 'vi' ? 'VI' : 'EN'}
      </MenuButton>
      <MenuList minW="150px">
        <MenuItem 
          onClick={() => changeLanguage('en')}
          justifyContent="space-between"
        >
          <Text>English</Text>
          {currentLanguage === 'en' && <Icon as={FaCheck} color="green.500" />}
        </MenuItem>
        <MenuItem 
          onClick={() => changeLanguage('vi')}
          justifyContent="space-between"
        >
          <Text>Tiếng Việt</Text>
          {currentLanguage === 'vi' && <Icon as={FaCheck} color="green.500" />}
        </MenuItem>
      </MenuList>
    </Menu>
  );
};

export default LanguageSwitcher; 
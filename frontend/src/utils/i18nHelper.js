/**
 * i18nHelper.js
 * Utilities to help enforce consistent use of translations
 */

import React, { createContext, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow as formatDistanceToNowOriginal } from 'date-fns';
import { vi } from 'date-fns/locale';

// Create a context to store i18n-related values
const I18nContext = createContext({
  currentLanguage: 'en',
  isVietnamese: false,
  formatDate: (date) => date.toString(),
  formatNumber: (number) => number.toString(),
  formatDistanceToNowLocalized: (date) => '',
});

/**
 * A wrapper hook for useTranslation that enforces using translations
 * @returns {Object} The translation functions and current language
 */
export const useAppTranslation = () => {
  const { t, i18n } = useTranslation();
  
  // Enhanced translation function that logs warnings in development when keys are missing
  const translate = (key, options) => {
    const translation = t(key, options);
    
    // If the translation is the same as the key, it might be missing
    if (process.env.NODE_ENV === 'development' && translation === key && !key.includes('.')) {
      console.warn(`[i18n] Possibly missing translation key: "${key}"`);
    }
    
    return translation;
  };
  
  return {
    t: translate,
    i18n,
    currentLanguage: i18n.language,
    isVietnamese: i18n.language === 'vi',
    changeLanguage: i18n.changeLanguage
  };
};

/**
 * Provider component for i18n utilities
 * This makes formatting functions available throughout the app without causing React hooks errors
 */
export const I18nProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const isVietnamese = currentLanguage === 'vi';
  
  // Format a date according to the current locale
  const formatDate = (date, options = {}) => {
    const locale = isVietnamese ? 'vi-VN' : 'en-US';
    
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    };
    
    return new Intl.DateTimeFormat(locale, defaultOptions).format(new Date(date));
  };
  
  // Format a number according to the current locale
  const formatNumber = (number, options = {}) => {
    const locale = isVietnamese ? 'vi-VN' : 'en-US';
    
    return new Intl.NumberFormat(locale, options).format(number);
  };
  
  // Format a relative time distance with localization
  const formatDistanceToNowLocalized = (date, options = {}) => {
    // Set appropriate locale
    const locale = isVietnamese ? vi : undefined;
    
    return formatDistanceToNowOriginal(date, {
      addSuffix: true,
      ...options,
      locale
    });
  };
  
  const contextValue = {
    currentLanguage,
    isVietnamese,
    formatDate,
    formatNumber,
    formatDistanceToNowLocalized,
  };
  
  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
};

/**
 * Hook to access i18n utility functions
 */
export const useI18nUtils = () => {
  return useContext(I18nContext);
};

/**
 * Translate notification messages based on patterns in the original message
 * @param {string} message - The original notification message
 * @param {Object} notification - The notification object
 * @param {Function} t - The translation function
 * @returns {string} The translated message
 */
export const translateNotificationMessage = (message, notification, t) => {
  if (!message) return '';
  
  // Extract entity type and name from message if available
  const entityType = notification.entityType || '';
  const entityName = extractEntityName(message, entityType);
  
  // Handle different notification actions
  if (notification.action) {
    switch (notification.action) {
      case 'create':
        if (message.includes('Great news!')) {
          return t('notifications.messages.create', {
            entityType: t(`notifications.entity_types.${entityType}`, entityType),
            entityName
          });
        }
        break;
      case 'update':
        if (message.includes('We\'ve just updated')) {
          return t('notifications.messages.update', {
            entityType: t(`notifications.entity_types.${entityType}`, entityType),
            entityName
          });
        }
        break;
      case 'delete':
        if (message.includes('has been removed')) {
          return t('notifications.messages.delete', {
            entityType: t(`notifications.entity_types.${entityType}`, entityType),
            entityName
          });
        }
        break;
      case 'cancel':
        if (entityType === 'session' && message.includes('Heads up!')) {
          // Handle session cancellation
          const dateInfoMatch = message.match(/scheduled for ([^)]+)/);
          const dateInfo = dateInfoMatch ? ` ${t('dashboard.scheduled_for')} ${dateInfoMatch[1]}` : '';
          
          const parentInfoMatch = message.match(/for ([^)]+)/);
          const parentInfo = parentInfoMatch ? ` ${t('common.for')} ${parentInfoMatch[1]}` : '';
          
          return t('notifications.messages.cancel_session', {
            dateInfo,
            parentInfo
          });
        } else if (message.includes('has been canceled')) {
          return t('notifications.messages.cancel', {
            entityType: t(`notifications.entity_types.${entityType}`, entityType),
            entityName
          });
        }
        break;
      case 'ending_soon':
        if (message.includes('is ending') && message.includes('days')) {
          // Extract date and days info
          const daysMatch = message.match(/in (\d+) days/);
          const dateMatch = message.match(/on ([^)]+)/);
          
          if (daysMatch && dateMatch) {
            const dayText = daysMatch[1] === '1' 
              ? t('dashboard.tomorrow')
              : t('dashboard.in_days', { count: parseInt(daysMatch[1]) });
            
            return t('notifications.messages.ending_soon_date', {
              entityType: t(`notifications.entity_types.${entityType}`, entityType),
              entityName,
              dayText,
              date: dateMatch[1]
            });
          }
        } else if (message.includes('ending soon')) {
          return t('notifications.messages.ending_soon', {
            entityType: t(`notifications.entity_types.${entityType}`, entityType),
            entityName
          });
        }
        break;
      default:
        break;
    }
  }
  
  // If no specific pattern matched, use the default translation
  if (entityType && entityName) {
    return t('notifications.messages.default', {
      entityType: t(`notifications.entity_types.${entityType}`, entityType),
      entityName
    });
  }
  
  // Return original message if no patterns matched
  return message;
};

/**
 * Extract entity name from notification message
 * @param {string} message - The notification message
 * @param {string} entityType - The entity type
 * @returns {string} The extracted entity name
 */
const extractEntityName = (message, entityType) => {
  if (!message || !entityType) return '';
  
  // Try to match pattern like 'entityType "entityName"'
  const regex = new RegExp(`${entityType} ["""]([^"""]+)["""]`);
  const match = message.match(regex);
  
  return match ? match[1] : '';
}; 
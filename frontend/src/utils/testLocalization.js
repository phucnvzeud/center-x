/**
 * Test Localization for Notifications
 * This script simulates notification translations in both English and Vietnamese
 */

import i18n from 'i18next';
import { translateNotificationMessage } from './i18nHelper';

// Sample notifications to test
const testNotifications = [
  {
    action: 'create',
    entityType: 'course',
    message: 'Great news! A new course "English for Beginners" has just been added to the system'
  },
  {
    action: 'update',
    entityType: 'teacher',
    message: 'We\'ve just updated the teacher "John Smith" with the latest information. Check it out!'
  },
  {
    action: 'delete',
    entityType: 'student',
    message: 'The student "Jane Doe" has been removed from the system. If this was a mistake, please contact support.'
  },
  {
    action: 'cancel',
    entityType: 'session',
    message: 'Heads up! The session scheduled for Aug 15, 2023 for Michael Johnson has been canceled. Please check your schedule.'
  },
  {
    action: 'ending_soon',
    entityType: 'course', 
    message: 'Just a friendly reminder that the course "Advanced Math" is ending in 5 days on September 30, 2023. Don\'t forget to prepare!'
  }
];

// Test function
export const testNotificationTranslations = () => {
  console.log('======= TESTING NOTIFICATION TRANSLATIONS =======');
  
  // Mock translation function
  const mockT = (key, options) => {
    const translations = {
      'en': {
        'notifications.messages.create': 'Great news! A new {{entityType}} named "{{entityName}}" has just been added to the system',
        'notifications.messages.update': 'We\'ve just updated the {{entityType}} "{{entityName}}" with the latest information. Check it out!',
        'notifications.messages.delete': 'The {{entityType}} "{{entityName}}" has been removed from the system. If this was a mistake, please contact support.',
        'notifications.messages.cancel_session': 'Heads up! The session{{dateInfo}}{{parentInfo}} has been canceled. Please check your schedule.',
        'notifications.messages.ending_soon_date': 'Reminder: The {{entityType}} "{{entityName}}" is ending {{dayText}} on {{date}}. Don\'t forget to prepare!',
        'notifications.entity_types.course': 'Course',
        'notifications.entity_types.teacher': 'Teacher',
        'notifications.entity_types.student': 'Student',
        'notifications.entity_types.session': 'Session',
        'dashboard.scheduled_for': 'scheduled for',
        'common.for': 'for',
        'dashboard.tomorrow': 'tomorrow',
        'dashboard.in_days': 'in {{count}} days'
      },
      'vi': {
        'notifications.messages.create': 'Tin tốt! Một {{entityType}} mới có tên "{{entityName}}" vừa được thêm vào hệ thống',
        'notifications.messages.update': 'Chúng tôi vừa cập nhật {{entityType}} "{{entityName}}" với thông tin mới nhất. Hãy kiểm tra!',
        'notifications.messages.delete': '{{entityType}} "{{entityName}}" đã bị xóa khỏi hệ thống. Nếu đây là sai sót, vui lòng liên hệ hỗ trợ.',
        'notifications.messages.cancel_session': 'Lưu ý! Buổi học{{dateInfo}}{{parentInfo}} đã bị hủy. Vui lòng kiểm tra lịch trình của bạn.',
        'notifications.messages.ending_soon_date': 'Nhắc nhở: {{entityType}} "{{entityName}}" sẽ kết thúc {{dayText}} vào ngày {{date}}. Đừng quên chuẩn bị!',
        'notifications.entity_types.course': 'Khóa Học',
        'notifications.entity_types.teacher': 'Giáo Viên',
        'notifications.entity_types.student': 'Học Sinh',
        'notifications.entity_types.session': 'Buổi Học',
        'dashboard.scheduled_for': 'đã lên lịch vào',
        'common.for': 'cho',
        'dashboard.tomorrow': 'ngày mai',
        'dashboard.in_days': 'trong {{count}} ngày'
      }
    };
    
    // Default to English
    const lang = i18n.language || 'en';
    
    // Get translation based on key and language
    let translation = translations[lang][key] || key;
    
    // Replace options in translation string
    if (options) {
      Object.keys(options).forEach(option => {
        const regex = new RegExp(`{{${option}}}`, 'g');
        translation = translation.replace(regex, options[option]);
      });
      
      // Handle plural forms
      if (options.count !== undefined) {
        translation = translation.replace(/{{count}}/g, options.count);
      }
    }
    
    return translation;
  };
  
  // Test in English
  console.log('\n--- English Translations ---');
  i18n.language = 'en';
  testNotifications.forEach(notification => {
    const translated = translateNotificationMessage(notification.message, notification, mockT);
    console.log(`Original: ${notification.message}`);
    console.log(`Translated: ${translated}`);
    console.log('---');
  });
  
  // Test in Vietnamese
  console.log('\n--- Vietnamese Translations ---');
  i18n.language = 'vi';
  testNotifications.forEach(notification => {
    const translated = translateNotificationMessage(notification.message, notification, mockT);
    console.log(`Original: ${notification.message}`);
    console.log(`Translated: ${translated}`);
    console.log('---');
  });
  
  console.log('========= TRANSLATION TESTING COMPLETE =========');
};

// Export a function to run the test
export const runTranslationTest = () => {
  console.log('Running translation test...');
  testNotificationTranslations();
  return 'Translation test completed. Check console for results.';
};

// Export default so it can be imported easily
export default {
  testNotificationTranslations,
  runTranslationTest
}; 
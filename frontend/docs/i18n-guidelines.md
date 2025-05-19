# Internationalization (i18n) Guidelines

This document provides guidelines for maintaining proper translations in the Center X Management application.

## Basic Rules

1. **Never use hardcoded text** in components. Always use the translation function from the `react-i18next` library.
2. **Use the `useAppTranslation` hook** from our custom helper (`src/utils/i18nHelper.js`) instead of the default `useTranslation`.
3. **Organize translation keys** in a logical structure based on the component or feature.
4. **Always provide translations** for both supported languages (English and Vietnamese).
5. **Use proper formatting** for dates, numbers, and currencies using the helper functions.

## Getting Started

### Import the translation hook

```javascript
import { useAppTranslation } from '../utils/i18nHelper';

const MyComponent = () => {
  const { t, isVietnamese } = useAppTranslation();
  
  return (
    <div>
      <h1>{t('my_component.title')}</h1>
      <p>{t('my_component.description')}</p>
    </div>
  );
};
```

### Adding New Translation Keys

When adding new features or text, add the translation keys to:
- `/public/locales/en/common.json` for English
- `/public/locales/vi/common.json` for Vietnamese

Ensure that the structure is consistent between both files.

```json
// English
{
  "feature": {
    "title": "Feature Title",
    "description": "This is a description"
  }
}

// Vietnamese
{
  "feature": {
    "title": "Tiêu Đề Tính Năng",
    "description": "Đây là mô tả"
  }
}
```

## Formatting

### Dates

Use the `formatDate` helper for consistent date formatting:

```javascript
import { formatDate } from '../utils/i18nHelper';

// Inside your component
<p>{formatDate(user.createdAt)}</p>
```

### Numbers

Use the `formatNumber` helper for numbers:

```javascript
import { formatNumber } from '../utils/i18nHelper';

// Inside your component
<p>{formatNumber(product.price, { style: 'currency', currency: 'VND' })}</p>
```

## Common Issues and Solutions

1. **Missing translations**: When a translation key is missing, the key itself will be displayed. In development mode, a warning will be logged to the console.

2. **Handling dynamic content**: Use interpolation for dynamic content:

```javascript
// Translation file
{
  "welcome": "Welcome, {{name}}!"
}

// Component
<p>{t('welcome', { name: user.name })}</p>
```

3. **Pluralization**: Use the count parameter for pluralization:

```javascript
// Translation file
{
  "items": "{{count}} item",
  "items_plural": "{{count}} items"
}

// Component
<p>{t('items', { count: itemCount })}</p>
```

## Testing Translations

Always test your component in both English and Vietnamese to ensure that translations are working correctly and that the UI can accommodate both languages without layout issues.

## Maintenance Tasks

1. Regularly review the translation files for missing or outdated translations.
2. Run automated checks to identify hardcoded text in components.
3. Keep the translation files well-organized and remove unused keys.

By following these guidelines, we can ensure a consistent and high-quality user experience for all users, regardless of their preferred language. 
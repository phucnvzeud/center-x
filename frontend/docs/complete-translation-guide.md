# Complete Translation Guide for Center X Management Application

This guide provides detailed instructions on how to ensure all routes and components in the application properly use translations for a complete multilingual experience.

## Overview

The Center X Management application supports both English and Vietnamese languages. To ensure a consistent user experience, all text displayed to users must be translated using the i18n framework. This includes:

- Page titles
- Button labels
- Form labels and placeholders
- Alert messages and notifications
- Table headers
- Status indicators and badges
- Modal titles and content
- Error messages

## Implementing Translations

### Step 1: Use the translation hook

Always use our custom `useAppTranslation` hook instead of the default React-i18next hook:

```javascript
import { useAppTranslation } from '../../utils/i18nHelper';

const MyComponent = () => {
  const { t, isVietnamese } = useAppTranslation();
  
  return (
    <Box>
      <Heading>{t('my_component.title')}</Heading>
      {/* Rest of component */}
    </Box>
  );
};
```

### Step 2: Create translation keys

All translation keys should be structured logically based on the component or feature. Add entries to both language files:

- `public/locales/en/common.json` for English
- `public/locales/vi/common.json` for Vietnamese

```json
// English
{
  "my_component": {
    "title": "My Component Title",
    "description": "This is a description"
  }
}

// Vietnamese
{
  "my_component": {
    "title": "Tiêu Đề Thành Phần Của Tôi",
    "description": "Đây là mô tả"
  }
}
```

### Step 3: Apply translations to all routes

For each route in your application, identify all user-facing text and wrap it with the translation function:

#### Headers and Titles

```jsx
<Heading size="lg">{t('component.title')}</Heading>
```

#### Buttons

```jsx
<Button colorScheme="blue">
  {t('common.save')}
</Button>
```

#### Form Elements

```jsx
<FormControl>
  <FormLabel>{t('common.name')}</FormLabel>
  <Input placeholder={t('common.name_placeholder')} />
</FormControl>
```

#### Tabs

```jsx
<Tabs>
  <TabList>
    <Tab>{t('component.tab1')}</Tab>
    <Tab>{t('component.tab2')}</Tab>
  </TabList>
</Tabs>
```

#### Table Headers

```jsx
<Thead>
  <Tr>
    <Th>{t('component.name')}</Th>
    <Th>{t('component.email')}</Th>
    <Th>{t('common.actions')}</Th>
  </Tr>
</Thead>
```

#### Alerts and Messages

```jsx
<Alert status="success">
  <AlertIcon />
  {t('component.success_message')}
</Alert>
```

#### Dynamic Content

For dynamic content, use interpolation:

```jsx
<Text>
  {t('component.items_count', { count: items.length })}
</Text>
```

### Step 4: Format Dates and Numbers

Use the provided format helpers for proper localization:

```jsx
import { formatDate, formatNumber } from '../../utils/i18nHelper';

// Inside component:
<Text>{formatDate(user.createdAt)}</Text>
<Text>{formatNumber(product.price, { style: 'currency', currency: 'VND' })}</Text>
```

## Checklist for Each Route

Use this checklist to ensure all components and routes are properly translated:

- [ ] Page title and headings
- [ ] Navigation links and breadcrumbs
- [ ] Form labels, placeholders, and help text
- [ ] Button labels 
- [ ] Table headers
- [ ] Status indicators and badges
- [ ] Empty state messages
- [ ] Error messages
- [ ] Success/confirmation messages
- [ ] Modal titles and content
- [ ] Dropdown options
- [ ] Pagination text

## Finding Untranslated Text

We've created a utility script to identify potentially untranslated text in components:

```bash
node scripts/find-untranslated-text.js
```

Run this script regularly to catch any missed translations.

## Best Practices

1. **Be consistent with key naming**: Follow the established pattern for key names.
2. **Use common keys**: Reuse common keys like 'common.save', 'common.cancel', etc.
3. **Keep translations organized**: Group related translations under the same parent key.
4. **Consider spacing**: Some languages may require more space than others.
5. **Test both languages**: Regularly check your UI in both supported languages.
6. **Update both language files**: Always add keys to both English and Vietnamese files.
7. **Use the appropriate context**: Use language-specific idioms and expressions where appropriate.

## Testing Your Translations

1. Use the Language Switcher in the application to toggle between languages
2. Test dynamic content with different data lengths
3. Check modal dialogs and alerts in both languages
4. Verify that date and number formats adjust correctly

## Common Issues and Solutions

### Missing Translations

If you see the key itself displayed in the UI, it means the translation is missing:

```json
// Add to both language files:
{
  "missing": {
    "key": "Translation text"
  }
}
```

### Text Not Updating on Language Change

Ensure you are using the translation hook properly and that the component re-renders when the language changes.

### Dynamic Translations

For dynamic content, use variables in translation strings:

```json
// Translation files
{
  "welcome": "Welcome, {{name}}!"
}

// Component
<Text>{t('welcome', { name: user.name })}</Text>
```

## Conclusion

By following this guide, you'll ensure that all routes in the Center X Management application are properly translated, providing a high-quality user experience for both English and Vietnamese users. Regular testing and use of the translation checklist will help catch any missed translations. 
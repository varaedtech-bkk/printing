// Minimal runtime translator with nested key support and variable interpolation
const fs = require('fs');
const path = require('path');

const localeDir = path.join(__dirname, '..', 'locales');

function readLocale(locale) {
  const filePath = path.join(localeDir, `${locale}.json`);
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

function getByPath(object, keyPath) {
  return keyPath.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), object);
}

function interpolate(template, vars = {}) {
  if (typeof template !== 'string') return template;
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name) => (vars[name] !== undefined ? String(vars[name]) : ''));
}

function createTranslator(defaultLocale = 'en') {
  let currentLocale = defaultLocale;
  let cache = {
    [defaultLocale]: readLocale(defaultLocale)
  };

  function setLocale(locale) {
    currentLocale = locale;
    if (!cache[locale]) {
      cache[locale] = readLocale(locale);
    }
  }

  function t(key, vars) {
    const primary = getByPath(cache[currentLocale], key);
    if (primary !== undefined) return interpolate(primary, vars);
    const fallback = getByPath(cache[defaultLocale], key);
    if (fallback !== undefined) return interpolate(fallback, vars);
    return key;
  }

  return { t, setLocale };
}

module.exports = { createTranslator };



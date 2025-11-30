/**
 * Transliteration map from Cyrillic to Latin characters
 */
const transliterationMap: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
  'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
  'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
  'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
  'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
  'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
  'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
  'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
  'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch',
  'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
};

/**
 * Converts Cyrillic text to Latin (transliteration) and converts to snake_case format
 * suitable for variable names
 *
 * @param text - Input text in Cyrillic or mixed format
 * @returns snake_case variable name (lowercase, with underscores)
 *
 * @example
 * transliterateToSnakeCase('Имя Клиента') // returns 'imya_klienta'
 * transliterateToSnakeCase('Email Адрес') // returns 'email_adres'
 * transliterateToSnakeCase('Телефон') // returns 'telefon'
 */
export function transliterateToSnakeCase(text: string): string {
  // Transliterate Cyrillic characters
  let result = '';
  for (const char of text) {
    if (char in transliterationMap) {
      result += transliterationMap[char];
    } else {
      result += char;
    }
  }

  // Convert to snake_case:
  // 1. Replace spaces and hyphens with underscores
  // 2. Remove all characters except letters, numbers, and underscores
  // 3. Replace multiple consecutive underscores with single underscore
  // 4. Convert to lowercase
  // 5. Remove leading/trailing underscores
  result = result
    .replace(/[\s-]+/g, '_')           // spaces and hyphens to underscores
    .replace(/[^a-zA-Z0-9_]/g, '')     // remove invalid chars
    .replace(/_+/g, '_')                // multiple underscores to single
    .toLowerCase()                      // convert to lowercase
    .replace(/^_+|_+$/g, '');          // trim underscores

  return result || 'variable';          // fallback if result is empty
}

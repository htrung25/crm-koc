import { Transform } from 'class-transformer';
import sanitizeHtml from 'sanitize-html';

/** Output remains HTML-escaped; clients render plain fields as text, never decode into innerHTML. */
export function sanitizeText(value: string): string {
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });
}

export function SanitizeText(
  options: { each?: boolean } = {},
): PropertyDecorator {
  return Transform(
    ({ value }: { value: unknown }) => {
      const clean = (item: unknown): unknown =>
        typeof item === 'string' ? sanitizeText(item) : item;
      return options.each && Array.isArray(value)
        ? value.map(clean)
        : clean(value);
    },
    { toClassOnly: true },
  );
}

export function SanitizeRichText(): PropertyDecorator {
  return Transform(
    ({ value }: { value: unknown }) => {
      if (typeof value !== 'string') return value;
      const clean = sanitizeHtml(value, {
        allowedTags: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'a'],
        allowedAttributes: { a: ['href'] },
        allowedSchemes: ['https'],
        allowProtocolRelative: false,
        transformTags: {
          a: (tagName, attributes): sanitizeHtml.Tag => {
            const href = attributes.href;
            // allowedSchemes alone also accepts relative links.
            return {
              tagName,
              attribs: href && /^https:\/\//i.test(href) ? { href } : {},
            };
          },
        },
      });
      // An empty paragraph is not a product description at submit time.
      return sanitizeText(clean)
        .replace(/&nbsp;/g, ' ')
        .trim()
        ? clean
        : '';
    },
    { toClassOnly: true },
  );
}

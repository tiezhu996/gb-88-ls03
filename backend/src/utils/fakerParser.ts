import { faker } from '@faker-js/faker';

export function parseFakerTemplate(template: string): any {
  try {
    let result = template;
    const fakerPattern = /\{\{(\w+)\.(\w+)\}\}/g;
    
    result = result.replace(fakerPattern, (match, category, method) => {
      try {
        const categoryLower = category.toLowerCase();
        const fakerCategory = (faker as any)[categoryLower];
        if (fakerCategory && typeof fakerCategory[method] === 'function') {
          return fakerCategory[method]();
        }
        return match;
      } catch {
        return match;
      }
    });
    
    return JSON.parse(result);
  } catch {
    try {
      return JSON.parse(template);
    } catch {
      return template;
    }
  }
}

export function checkCondition(
  condition: { field: string; operator: string; value: string },
  query: Record<string, string>,
  body: any,
  headers: Record<string, string>
): boolean {
  const fieldValue = 
    query[condition.field] !== undefined ? query[condition.field] :
    body && body[condition.field] !== undefined ? body[condition.field] :
    headers[condition.field] !== undefined ? headers[condition.field] :
    undefined;

  if (fieldValue === undefined) return false;

  const value = String(fieldValue);
  const target = condition.value;

  switch (condition.operator) {
    case 'equals':
      return value === target;
    case 'contains':
      return value.includes(target);
    case 'startsWith':
      return value.startsWith(target);
    case 'endsWith':
      return value.endsWith(target);
    default:
      return false;
  }
}

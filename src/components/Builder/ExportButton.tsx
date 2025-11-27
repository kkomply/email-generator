import type { Block, JSONSchema, JSONSchemaProperty } from '../../types';
import './ExportButton.css';

interface ExportButtonProps {
  blocks: Block[];
}

function ExportButton({ blocks }: ExportButtonProps) {
  const generateTemplate = (): string => {
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Template</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f4f4f4;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      padding: 20px;
    }
  </style>
</head>
<body>
  <div class="email-container">
`;

    blocks.forEach(block => {
      switch (block.type) {
        case 'text':
          const textContent = block.isDynamic
            ? `{{${block.dynamicField?.variableName}}}`
            : block.content;
          html += `    <div style="font-size: ${block.styles?.fontSize}; color: ${block.styles?.color}; text-align: ${block.styles?.textAlign}; padding: ${block.styles?.padding};">
      ${textContent}
    </div>\n`;
          break;

        case 'image':
          const imgSrc = block.isDynamic
            ? `{{${block.dynamicField?.variableName}}}`
            : block.content;
          html += `    <div style="text-align: center; padding: 10px;">
      <img src="${imgSrc}" alt="Email image" style="max-width: 100%; height: auto;" />
    </div>\n`;
          break;

        case 'button':
          const buttonText = block.isDynamic
            ? `{{${block.dynamicField?.variableName}}}`
            : block.content;
          html += `    <div style="text-align: center; padding: 10px;">
      <a href="#" style="display: inline-block; font-size: ${block.styles?.fontSize}; color: ${block.styles?.color}; background-color: ${block.styles?.backgroundColor}; padding: ${block.styles?.padding}; text-decoration: none; border-radius: 4px;">
        ${buttonText}
      </a>
    </div>\n`;
          break;

        case 'divider':
          html += `    <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;" />\n`;
          break;

        case 'spacer':
          html += `    <div style="height: 30px;"></div>\n`;
          break;

        case 'heading': {
          const level = block.styles?.level || 'h2';
          const content = block.isDynamic && block.dynamicField?.variableName
            ? `{{${block.dynamicField.variableName}}}`
            : block.content;

          html += `    <${level} style="font-size: ${block.styles?.fontSize || '24px'}; color: ${block.styles?.color || '#111827'}; text-align: ${block.styles?.textAlign || 'left'}; padding: ${block.styles?.padding || '10px'}; font-weight: ${block.styles?.fontWeight || '700'}; margin: 0;">${content}</${level}>\n`;
          break;
        }

        case 'list': {
          const listTag = block.styles?.listType || 'ul';
          const listStyle = block.styles?.listStyle || 'disc';
          const items = block.listItems || [];

          const itemsHtml = items.map((item, index) => {
            const content = block.isDynamic && block.dynamicField?.variableName
              ? `{{${block.dynamicField.variableName}_item_${index + 1}}}`
              : item;
            return `<li>${content}</li>`;
          }).join('');

          html += `    <${listTag} style="font-size: ${block.styles?.fontSize || '16px'}; color: ${block.styles?.color || '#333333'}; padding: ${block.styles?.padding || '10px'}; list-style-type: ${listStyle}; margin: 0; padding-left: 20px;">${itemsHtml}</${listTag}>\n`;
          break;
        }
      }
    });

    html += `  </div>
</body>
</html>`;

    return html;
  };

  const generateSchema = (): JSONSchema => {
    const properties: Record<string, JSONSchemaProperty> = {};
    const required: string[] = [];

    blocks.forEach(block => {
      if (block.isDynamic && block.dynamicField) {
        const { variableName, fieldLabel, fieldType, required: isRequired, options } = block.dynamicField;

        if (!variableName) return;

        let schemaType = 'string';
        if (fieldType === 'number') schemaType = 'number';
        if (fieldType === 'checkbox') schemaType = 'boolean';

        const property: JSONSchemaProperty = {
          type: schemaType,
          title: fieldLabel || variableName,
        };

        if (fieldType === 'select' && options && options.length > 0) {
          property.enum = options;
        }

        properties[variableName] = property;

        if (isRequired) {
          required.push(variableName);
        }
      }
    });

    return {
      type: 'object',
      properties,
      required,
    };
  };

  const handleExport = () => {
    const template = generateTemplate();
    const schema = generateSchema();

    console.log('=== Export Debug ===');
    console.log('Blocks:', blocks);
    console.log('Generated Schema:', schema);
    console.log('Schema Properties:', Object.keys(schema.properties));
    console.log('Schema Required:', schema.required);
    console.log('==================');

    // Check if schema has properties
    const hasProperties = Object.keys(schema.properties).length > 0;

    if (!hasProperties) {
      alert('Предупреждение: Динамические поля не найдены! Пожалуйста, добавьте хотя бы одно динамическое поле с Именем переменной перед экспортом.');
      return;
    }

    // Download template.html
    const templateBlob = new Blob([template], { type: 'text/html' });
    const templateUrl = URL.createObjectURL(templateBlob);
    const templateLink = document.createElement('a');
    templateLink.href = templateUrl;
    templateLink.download = 'template.html';
    document.body.appendChild(templateLink);
    templateLink.click();
    document.body.removeChild(templateLink);

    // Download schema.json with slight delay
    setTimeout(() => {
      const schemaBlob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' });
      const schemaUrl = URL.createObjectURL(schemaBlob);
      const schemaLink = document.createElement('a');
      schemaLink.href = schemaUrl;
      schemaLink.download = 'schema.json';
      document.body.appendChild(schemaLink);
      schemaLink.click();
      document.body.removeChild(schemaLink);

      // Cleanup
      setTimeout(() => {
        URL.revokeObjectURL(templateUrl);
        URL.revokeObjectURL(schemaUrl);
      }, 100);

      alert(`Шаблон и схема успешно экспортированы!\n\nДинамических полей: ${Object.keys(schema.properties).length}`);
    }, 100);
  };

  return (
    <button className="export-button" onClick={handleExport}>
      Экспорт шаблона
    </button>
  );
}

export default ExportButton;

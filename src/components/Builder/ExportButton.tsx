import type { Block, JSONSchema, JSONSchemaProperty, JSONSchemaDependency } from '../../types';
import { transliterateToSnakeCase } from '../../utils/transliterate';
import './ExportButton.css';

interface ExportButtonProps {
  blocks: Block[];
}

// Helper function to extract inline variables from text
interface InlineVariable {
  label: string;        // e.g., "Имя клиента"
  variableName: string; // e.g., "imya_klienta"
}

function extractInlineVariables(text: string): InlineVariable[] {
  const regex = /\{\{([^}]+)\}\}/g;
  const variables: InlineVariable[] = [];
  const seen = new Set<string>();

  let match;
  while ((match = regex.exec(text)) !== null) {
    const label = match[1].trim();
    if (!seen.has(label)) {
      seen.add(label);
      variables.push({
        label,
        variableName: transliterateToSnakeCase(label)
      });
    }
  }

  return variables;
}

function replaceInlineVariables(text: string, variables: InlineVariable[]): string {
  let result = text;
  variables.forEach(v => {
    const pattern = new RegExp(`\\{\\{${v.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}\\}`, 'g');
    result = result.replace(pattern, `{{${v.variableName}}}`);
  });
  return result;
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
        case 'text': {
          // Extract and replace inline variables
          const inlineVars = extractInlineVariables(block.content);
          const processedContent = replaceInlineVariables(block.content, inlineVars);

          html += `    <div style="font-size: ${block.styles?.fontSize}; color: ${block.styles?.color}; text-align: ${block.styles?.textAlign}; padding: ${block.styles?.padding};">
      ${processedContent}
    </div>\n`;
          break;
        }

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
          // Backward compatibility - old divider blocks
          html += `    <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;" />\n`;
          break;

        case 'spacer': {
          const height = block.height || 30;
          const showLine = block.showLine || false;

          if (showLine) {
            // Export as divider with height margins
            const topMargin = Math.floor(height / 2);
            const bottomMargin = height - topMargin;
            html += `    <hr style="margin: ${topMargin}px 0 ${bottomMargin}px 0; border: none; border-top: 1px solid #ddd;" />\n`;
          } else {
            // Export as simple spacer
            html += `    <div style="height: ${height}px;"></div>\n`;
          }
          break;
        }

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

        case 'table': {
          const columns = block.columns || [];
          const tableVarName = block.tableVariableName || 'table_data';
          const tableLabel = block.tableLabel || 'Таблица';

          if (columns.length === 0) break;

          html += `    <h3 style="font-size: 18px; color: #374151; margin-top: 20px; margin-bottom: 10px;">${tableLabel}:</h3>\n`;
          html += `    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">\n`;

          // Header row
          html += `      <thead>\n`;
          html += `        <tr>\n`;
          columns.forEach(col => {
            html += `          <th style="padding: 10px; text-align: left; background-color: #F3F4F6; border: 1px solid #E5E7EB; font-weight: 600; color: #374151;">${col.label}</th>\n`;
          });
          html += `        </tr>\n`;
          html += `      </thead>\n`;

          // Body with Handlebars loop
          html += `      <tbody>\n`;
          html += `        {{#each ${tableVarName}}}\n`;
          html += `        <tr>\n`;
          columns.forEach(col => {
            html += `          <td style="padding: 10px; border: 1px solid #E5E7EB; color: #374151;">{{this.${col.variableName}}}</td>\n`;
          });
          html += `        </tr>\n`;
          html += `        {{/each}}\n`;
          html += `      </tbody>\n`;
          html += `    </table>\n`;
          break;
        }

        case 'checkbox-group': {
          const varName = block.dynamicField?.variableName || 'checkbox_group';

          html += `    <div style="padding: 10px;">\n`;
          html += `      <ul style="list-style-type: none; padding-left: 0; margin: 0;">\n`;
          html += `        {{#each ${varName}}}\n`;
          html += `        <li style="padding: 4px 0; color: #374151;">{{{this}}}</li>\n`;
          html += `        {{/each}}\n`;
          html += `      </ul>\n`;
          html += `    </div>\n`;
          break;
        }

        case 'radio-group': {
          const varName = block.dynamicField?.variableName || 'radio_group';

          html += `    <div style="padding: 10px;">\n`;
          html += `      <p style="margin: 0; color: #374151;">{{{${varName}}}}</p>\n`;
          html += `    </div>\n`;
          break;
        }
      }
    });

    html += `  </div>
</body>
</html>`;

    return html;
  };

  const generateSchema = (): { schema: JSONSchema; uiSchema: Record<string, any> } => {
    const properties: Record<string, any> = {};
    const required: string[] = [];
    const dependencies: Record<string, JSONSchemaDependency> = {};
    const uiSchema: Record<string, any> = {};

    // Collect all fields with their dependencies
    const fieldsWithDependencies: string[] = [];

    blocks.forEach(block => {
      // Handle text blocks with inline variables
      if (block.type === 'text') {
        const inlineVars = extractInlineVariables(block.content);
        inlineVars.forEach(v => {
          if (!properties[v.variableName]) {
            properties[v.variableName] = {
              type: 'string',
              title: v.label
            };
          }
        });
      }

      // Handle checkbox-group blocks
      if (block.type === 'checkbox-group' && block.dynamicField && block.groupOptions && block.groupOptions.length > 0) {
        const { variableName, fieldLabel, required: isRequired } = block.dynamicField;

        if (!variableName) return;

        properties[variableName] = {
          type: 'array',
          title: fieldLabel || variableName,
          items: {
            type: 'string',
            enum: block.groupOptions.map(opt => opt.value),
            enumNames: block.groupOptions.map(opt => opt.label)
          },
          uniqueItems: true
        };

        // Set UI widget to checkboxes for better UX
        uiSchema[variableName] = {
          'ui:widget': 'checkboxes'
        };

        if (isRequired) {
          required.push(variableName);
        }
        return; // Skip regular dynamic field processing
      }

      // Handle radio-group blocks
      if (block.type === 'radio-group' && block.dynamicField && block.groupOptions && block.groupOptions.length > 0) {
        const { variableName, fieldLabel, required: isRequired } = block.dynamicField;

        if (!variableName) return;

        properties[variableName] = {
          type: 'string',
          title: fieldLabel || variableName,
          enum: block.groupOptions.map(opt => opt.value),
          enumNames: block.groupOptions.map(opt => opt.label)
        };

        // Set UI widget to radio for better UX
        uiSchema[variableName] = {
          'ui:widget': 'radio'
        };

        if (isRequired) {
          required.push(variableName);
        }
        return; // Skip regular dynamic field processing
      }

      // Handle table blocks
      if (block.type === 'table' && block.columns && block.columns.length > 0) {
        const tableVarName = block.tableVariableName || 'table_data';
        const tableLabel = block.tableLabel || 'Таблица';

        // Build the items schema from columns
        const itemProperties: Record<string, any> = {};
        block.columns.forEach(col => {
          let schemaType = 'string';
          if (col.type === 'number') schemaType = 'number';
          if (col.type === 'email') schemaType = 'string';

          const property: any = {
            type: schemaType,
            title: col.label
          };

          // Add enum and enumNames for select columns
          if (col.type === 'select' && col.options && col.options.length > 0) {
            property.enum = col.options.map(opt => opt.value);
            property.enumNames = col.options.map(opt => opt.label);
          }

          itemProperties[col.variableName] = property;
        });

        // Create array schema
        properties[tableVarName] = {
          type: 'array',
          title: tableLabel,
          items: {
            type: 'object',
            properties: itemProperties
          }
        };
      }

      if (block.isDynamic && block.dynamicField) {
        const { variableName, fieldLabel, fieldType, required: isRequired, options, dependency } = block.dynamicField;

        if (!variableName) return;

        let schemaType = 'string';
        if (fieldType === 'number') schemaType = 'number';
        if (fieldType === 'checkbox') schemaType = 'boolean';

        const property: JSONSchemaProperty = {
          type: schemaType,
          title: fieldLabel || variableName,
        };

        if (fieldType === 'select' && options && options.length > 0) {
          // Filter out empty options
          const validOptions = options.filter(opt => opt && opt.length > 0);
          if (validOptions.length > 0) {
            property.enum = validOptions;
          }
        }

        properties[variableName] = property;

        // Handle dependencies
        if (dependency && dependency.parentVariable && dependency.expectedValue) {
          fieldsWithDependencies.push(variableName);

          // Store dependency info for later processing
          if (!dependencies[dependency.parentVariable]) {
            dependencies[dependency.parentVariable] = {
              oneOf: []
            };
          }

          // Add condition when field should be shown
          // Note: We always include the field in 'required' array here to track dependencies
          // even if it's not a required field (for conditional visibility)
          dependencies[dependency.parentVariable].oneOf.push({
            properties: {
              [dependency.parentVariable]: {
                const: dependency.expectedValue
              }
            },
            required: [variableName] // Always include for dependency tracking
          });
        } else if (isRequired) {
          // Only add to main required list if no dependency
          required.push(variableName);
        }
      }
    });

    const schema: JSONSchema = {
      type: 'object',
      properties,
      required,
    };

    // Only add dependencies if there are any
    if (Object.keys(dependencies).length > 0) {
      schema.dependencies = dependencies;
    }

    return { schema, uiSchema };
  };

  const handleExport = () => {
    const template = generateTemplate();
    const { schema, uiSchema } = generateSchema();

    console.log('=== Export Debug ===');
    console.log('Blocks:', blocks);
    const dynamicBlocks = blocks.filter(b => b.isDynamic).map(b => ({
      type: b.type,
      label: b.dynamicField?.fieldLabel,
      varName: b.dynamicField?.variableName,
      fieldType: b.dynamicField?.fieldType,
      dependency: b.dynamicField?.dependency,
      groupOptions: (b.type === 'checkbox-group' || b.type === 'radio-group') ? b.groupOptions : undefined
    }));
    console.log('Dynamic Blocks:', dynamicBlocks);
    dynamicBlocks.forEach((db, i) => {
      console.log(`Block ${i + 1}:`, db);
    });
    console.log('Generated Schema:', schema);
    console.log('Schema Properties:', Object.keys(schema.properties));
    console.log('Schema Required:', schema.required);
    console.log('Schema Dependencies:', schema.dependencies);
    console.log('UI Schema:', uiSchema);
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

    // Download schema.json with slight delay (includes schema + uiSchema)
    setTimeout(() => {
      const schemaExport = {
        schema,
        uiSchema: Object.keys(uiSchema).length > 0 ? uiSchema : undefined
      };
      const schemaBlob = new Blob([JSON.stringify(schemaExport, null, 2)], { type: 'application/json' });
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

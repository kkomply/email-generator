import { useMemo, useEffect } from 'react';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import type { JSONSchema } from '../../types';
import './FormRenderer.css';

interface FormRendererProps {
  schema: JSONSchema;
  uiSchema?: Record<string, any>;
  formData: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

function FormRenderer({ schema, uiSchema, formData, onChange }: FormRendererProps) {
  const handleChange = (data: any) => {
    onChange(data.formData);
  };

  // Apply conditional logic to schema based on current formData
  const conditionalSchema = useMemo(() => {
    if (!schema.dependencies) {
      return schema;
    }

    // Clone the schema
    const newSchema = JSON.parse(JSON.stringify(schema)) as JSONSchema;

    // Step 1: Collect ALL dependent fields (fields that should be hidden by default)
    const allDependentFields = new Set<string>();
    Object.values(schema.dependencies).forEach(dependency => {
      dependency.oneOf.forEach(condition => {
        if (condition.required) {
          condition.required.forEach(field => allDependentFields.add(field));
        }
      });
    });

    // Step 2: Find which fields should be SHOWN (condition is met)
    const fieldsToShow = new Set<string>();
    Object.entries(schema.dependencies).forEach(([parentField, dependency]) => {
      const parentValue = formData[parentField];

      dependency.oneOf.forEach(condition => {
        const expectedValue = condition.properties[parentField]?.const;
        const conditionMet = parentValue === expectedValue;

        if (conditionMet) {
          // Show these fields since condition IS met
          const fieldsInCondition = condition.required || [];
          fieldsInCondition.forEach(field => fieldsToShow.add(field));
        }
      });
    });

    // Step 3: Hide dependent fields that are NOT in fieldsToShow
    const fieldsToHide = new Set<string>();
    allDependentFields.forEach(field => {
      if (!fieldsToShow.has(field)) {
        fieldsToHide.add(field);
      }
    });

    // Step 4: Remove hidden fields from schema
    fieldsToHide.forEach(field => {
      if (newSchema.properties[field]) {
        delete newSchema.properties[field];
      }
      // Also remove from required array if present
      const reqIndex = newSchema.required.indexOf(field);
      if (reqIndex > -1) {
        newSchema.required.splice(reqIndex, 1);
      }
    });

    console.log('Conditional Schema Debug:', {
      originalProperties: Object.keys(schema.properties),
      filteredProperties: Object.keys(newSchema.properties),
      allDependentFields: Array.from(allDependentFields),
      fieldsToShow: Array.from(fieldsToShow),
      fieldsToHide: Array.from(fieldsToHide),
      formData,
      parentValues: Object.keys(schema.dependencies || {}).map(k => ({
        field: k,
        value: formData[k]
      }))
    });

    return newSchema;
  }, [schema, formData]);

  // Улучшаем кнопки массивов после рендера
  useEffect(() => {
    const styleButtons = () => {
      const formElement = document.querySelector('.form-renderer');
      if (!formElement) return;

      // Находим все кнопки внутри формы
      const buttons = formElement.querySelectorAll('button');

      buttons.forEach((button) => {
        const buttonText = button.textContent?.trim() || '';

        // Пропускаем скрытую кнопку submit
        if (button.type === 'submit') return;

        // Определяем тип кнопки по тексту
        if (buttonText.includes('Move up') || buttonText === '▴' || button.className.includes('up')) {
          button.textContent = '↑';
          button.style.backgroundColor = '#6B7280';
          button.style.minWidth = '36px';
          button.style.padding = '4px 8px';
          button.style.fontSize = '1rem';
        } else if (buttonText.includes('Move down') || buttonText === '▾' || button.className.includes('down')) {
          button.textContent = '↓';
          button.style.backgroundColor = '#6B7280';
          button.style.minWidth = '36px';
          button.style.padding = '4px 8px';
          button.style.fontSize = '1rem';
        } else if (buttonText.includes('Remove') || buttonText === '-' || button.className.includes('danger')) {
          button.textContent = '✕ Удалить';
          button.style.backgroundColor = '#EF4444';
          button.style.minWidth = '85px';
          button.style.padding = '4px 10px';
          button.style.fontSize = '0.8rem';
        } else {
          // Все остальные кнопки (включая Add) - делаем большими
          console.log('Other button text:', buttonText);
          button.textContent = '+ Добавить строку';
          button.style.backgroundColor = '#3B82F6';
          button.style.padding = '10px 20px';
          button.style.minWidth = '160px';
          button.style.fontSize = '0.9rem';
          button.style.fontWeight = '500';
          button.style.marginTop = '12px';
        }
      });
    };

    // Запускаем стилизацию после небольшой задержки
    const timer = setTimeout(styleButtons, 100);

    return () => clearTimeout(timer);
  }, [formData, conditionalSchema]);

  return (
    <div className="form-renderer">
      <Form
        schema={conditionalSchema as any}
        uiSchema={uiSchema}
        formData={formData}
        validator={validator}
        onChange={handleChange}
        onSubmit={(data) => console.log('Form submitted:', data.formData)}
      >
        <button type="submit" style={{ display: 'none' }}>Submit</button>
      </Form>
    </div>
  );
}

export default FormRenderer;

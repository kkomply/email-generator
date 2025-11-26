import { useState } from 'react';
import type { Block, DynamicField, FieldType } from '../../types';
import './PropertiesPanel.css';

interface PropertiesPanelProps {
  block: Block;
  onUpdate: (id: string, updates: Partial<Block>) => void;
}

function PropertiesPanel({ block, onUpdate }: PropertiesPanelProps) {
  const [isDynamic, setIsDynamic] = useState(block.isDynamic);

  const handleContentChange = (content: string) => {
    onUpdate(block.id, { content });
  };

  const handleStyleChange = (key: string, value: string) => {
    onUpdate(block.id, {
      styles: { ...block.styles, [key]: value },
    });
  };

  const handleDynamicToggle = (checked: boolean) => {
    setIsDynamic(checked);
    if (checked) {
      onUpdate(block.id, {
        isDynamic: true,
        dynamicField: {
          variableName: '',
          fieldLabel: '',
          fieldType: 'text',
          required: false,
        },
      });
    } else {
      onUpdate(block.id, {
        isDynamic: false,
        dynamicField: undefined,
      });
    }
  };

  const handleDynamicFieldChange = (key: keyof DynamicField, value: any) => {
    // Validate variable name format
    if (key === 'variableName' && typeof value === 'string') {
      // Remove spaces and special characters except underscore
      const sanitized = value.replace(/[^a-zA-Z0-9_]/g, '_');
      onUpdate(block.id, {
        dynamicField: { ...block.dynamicField!, [key]: sanitized },
      });
      return;
    }

    onUpdate(block.id, {
      dynamicField: { ...block.dynamicField!, [key]: value },
    });
  };

  const handleOptionsChange = (optionsText: string) => {
    const options = optionsText.split(',').map(opt => opt.trim()).filter(opt => opt);
    handleDynamicFieldChange('options', options);
  };

  return (
    <div className="properties-panel">
      <h3>Свойства</h3>

      <div className="property-section">
        <label className="property-label">Тип блока</label>
        <div className="property-value">{block.type}</div>
      </div>

      {/* Content editing */}
      {(block.type === 'text' || block.type === 'button') && (
        <div className="property-section">
          <label className="property-label">Содержимое</label>
          {block.type === 'text' ? (
            <textarea
              className="property-input"
              value={block.content}
              onChange={(e) => handleContentChange(e.target.value)}
              disabled={isDynamic}
              rows={4}
            />
          ) : (
            <input
              type="text"
              className="property-input"
              value={block.content}
              onChange={(e) => handleContentChange(e.target.value)}
              disabled={isDynamic}
            />
          )}
        </div>
      )}

      {block.type === 'image' && (
        <div className="property-section">
          <label className="property-label">URL изображения</label>
          <input
            type="text"
            className="property-input"
            value={block.content}
            onChange={(e) => handleContentChange(e.target.value)}
            disabled={isDynamic}
          />
        </div>
      )}

      {/* Style editing */}
      {(block.type === 'text' || block.type === 'button') && (
        <>
          <div className="property-section">
            <label className="property-label">Размер шрифта</label>
            <input
              type="text"
              className="property-input"
              value={block.styles?.fontSize || '16px'}
              onChange={(e) => handleStyleChange('fontSize', e.target.value)}
            />
          </div>

          <div className="property-section">
            <label className="property-label">Цвет текста</label>
            <input
              type="color"
              className="property-input"
              value={block.styles?.color || '#000000'}
              onChange={(e) => handleStyleChange('color', e.target.value)}
            />
          </div>

          {block.type === 'text' && (
            <div className="property-section">
              <label className="property-label">Выравнивание текста</label>
              <select
                className="property-input"
                value={block.styles?.textAlign || 'left'}
                onChange={(e) => handleStyleChange('textAlign', e.target.value)}
              >
                <option value="left">Слева</option>
                <option value="center">По центру</option>
                <option value="right">Справа</option>
              </select>
            </div>
          )}

          {block.type === 'button' && (
            <div className="property-section">
              <label className="property-label">Цвет фона</label>
              <input
                type="color"
                className="property-input"
                value={block.styles?.backgroundColor || '#007bff'}
                onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
              />
            </div>
          )}
        </>
      )}

      {/* Dynamic field configuration */}
      <div className="property-section dynamic-section">
        <label className="property-checkbox">
          <input
            type="checkbox"
            checked={isDynamic}
            onChange={(e) => handleDynamicToggle(e.target.checked)}
          />
          <span>Сделать динамическим</span>
        </label>
      </div>

      {isDynamic && block.dynamicField && (
        <div className="dynamic-fields">
          <div className="property-section">
            <label className="property-label">Имя переменной</label>
            <input
              type="text"
              className="property-input"
              placeholder="например: client_name"
              value={block.dynamicField.variableName}
              onChange={(e) => handleDynamicFieldChange('variableName', e.target.value)}
            />
            <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              Только латинские буквы, цифры и подчеркивание. Пробелы будут заменены на "_"
            </small>
          </div>

          <div className="property-section">
            <label className="property-label">Название поля</label>
            <input
              type="text"
              className="property-input"
              placeholder="например: Имя клиента"
              value={block.dynamicField.fieldLabel}
              onChange={(e) => handleDynamicFieldChange('fieldLabel', e.target.value)}
            />
          </div>

          <div className="property-section">
            <label className="property-label">Тип поля</label>
            <select
              className="property-input"
              value={block.dynamicField.fieldType}
              onChange={(e) => handleDynamicFieldChange('fieldType', e.target.value as FieldType)}
            >
              <option value="text">Текст</option>
              <option value="textarea">Текстовая область</option>
              <option value="number">Число</option>
              <option value="email">Email</option>
              <option value="select">Выпадающий список</option>
              <option value="checkbox">Чекбокс</option>
            </select>
          </div>

          {block.dynamicField.fieldType === 'select' && (
            <div className="property-section">
              <label className="property-label">Варианты (через запятую)</label>
              <input
                type="text"
                className="property-input"
                placeholder="Вариант 1, Вариант 2, Вариант 3"
                value={block.dynamicField.options?.join(', ') || ''}
                onChange={(e) => handleOptionsChange(e.target.value)}
              />
            </div>
          )}

          <div className="property-section">
            <label className="property-checkbox">
              <input
                type="checkbox"
                checked={block.dynamicField.required || false}
                onChange={(e) => handleDynamicFieldChange('required', e.target.checked)}
              />
              <span>Обязательное поле</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

export default PropertiesPanel;

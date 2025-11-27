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
      {block.type === 'list' ? (
        <div className="property-section">
          <label className="property-label">Элементы списка</label>
          {(block.listItems || []).map((item, index) => (
            <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                type="text"
                className="property-input"
                value={item}
                onChange={(e) => {
                  const newItems = [...(block.listItems || [])];
                  newItems[index] = e.target.value;
                  onUpdate(block.id, { listItems: newItems });
                }}
                placeholder={`Пункт ${index + 1}`}
                style={{ flex: 1 }}
              />
              <button
                onClick={() => {
                  const newItems = block.listItems?.filter((_, i) => i !== index) || [];
                  onUpdate(block.id, { listItems: newItems });
                }}
                style={{
                  padding: '0.5rem',
                  backgroundColor: 'var(--color-error)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              const newItems = [...(block.listItems || []), `Пункт ${(block.listItems?.length || 0) + 1}`];
              onUpdate(block.id, { listItems: newItems });
            }}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            + Добавить пункт
          </button>
        </div>
      ) : (block.type === 'text' || block.type === 'button' || block.type === 'heading') && (
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
      {(block.type === 'text' || block.type === 'button' || block.type === 'heading') && (
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

          {(block.type === 'text' || block.type === 'heading') && (
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

      {/* List specific properties */}
      {block.type === 'list' && (
        <>
          <div className="property-section">
            <label className="property-label">Тип списка</label>
            <select
              className="property-input"
              value={block.styles?.listType || 'ul'}
              onChange={(e) => {
                const newListType = e.target.value as 'ul' | 'ol';
                const defaultStyle = newListType === 'ul' ? 'disc' : 'decimal';
                handleStyleChange('listType', newListType);
                handleStyleChange('listStyle', defaultStyle);
              }}
            >
              <option value="ul">Маркированный (•)</option>
              <option value="ol">Нумерованный (1, 2, 3)</option>
            </select>
          </div>

          <div className="property-section">
            <label className="property-label">Стиль списка</label>
            <select
              className="property-input"
              value={block.styles?.listStyle || 'disc'}
              onChange={(e) => handleStyleChange('listStyle', e.target.value)}
            >
              {block.styles?.listType === 'ol' ? (
                <>
                  <option value="decimal">Числа (1, 2, 3)</option>
                  <option value="lower-alpha">Буквы строчные (a, b, c)</option>
                  <option value="upper-alpha">Буквы прописные (A, B, C)</option>
                  <option value="lower-roman">Римские строчные (i, ii, iii)</option>
                  <option value="upper-roman">Римские прописные (I, II, III)</option>
                </>
              ) : (
                <>
                  <option value="disc">Круг (•)</option>
                  <option value="circle">Окружность (○)</option>
                  <option value="square">Квадрат (■)</option>
                </>
              )}
            </select>
          </div>

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
              value={block.styles?.color || '#333333'}
              onChange={(e) => handleStyleChange('color', e.target.value)}
            />
          </div>
        </>
      )}

      {/* Heading specific properties */}
      {block.type === 'heading' && (
        <div className="property-section">
          <label className="property-label">Уровень заголовка</label>
          <select
            className="property-input"
            value={block.styles?.level || 'h2'}
            onChange={(e) => handleStyleChange('level', e.target.value)}
          >
            <option value="h1">H1 (Самый крупный)</option>
            <option value="h2">H2 (Крупный)</option>
            <option value="h3">H3 (Средний)</option>
            <option value="h4">H4 (Обычный)</option>
            <option value="h5">H5 (Мелкий)</option>
            <option value="h6">H6 (Самый мелкий)</option>
          </select>
        </div>
      )}

      {block.type === 'heading' && (
        <div className="property-section">
          <label className="property-label">Толщина шрифта</label>
          <select
            className="property-input"
            value={block.styles?.fontWeight || '700'}
            onChange={(e) => handleStyleChange('fontWeight', e.target.value)}
          >
            <option value="400">Обычный</option>
            <option value="500">Средний</option>
            <option value="600">Полужирный</option>
            <option value="700">Жирный</option>
            <option value="800">Очень жирный</option>
          </select>
        </div>
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

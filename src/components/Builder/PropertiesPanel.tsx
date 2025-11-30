import { useState, useEffect } from 'react';
import type { Block, DynamicField, FieldType, FieldDependency, TableColumn, ColumnType, SelectOption } from '../../types';
import { transliterateToSnakeCase } from '../../utils/transliterate';
import RichTextEditor from './RichTextEditor';
import Modal from '../UI/Modal';
import './PropertiesPanel.css';

interface PropertiesPanelProps {
  block: Block;
  blocks: Block[]; // All blocks for dependency selection
  onUpdate: (id: string, updates: Partial<Block>) => void;
}

function PropertiesPanel({ block, blocks, onUpdate }: PropertiesPanelProps) {
  const [isDynamic, setIsDynamic] = useState(block.isDynamic);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [autoGenerateVarName, setAutoGenerateVarName] = useState(true);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [editingColumnIndex, setEditingColumnIndex] = useState<number | null>(null);

  // Get all dynamic blocks except the current one for dependency selection
  const availableParentBlocks = blocks.filter(
    b => b.id !== block.id && b.isDynamic && b.dynamicField?.variableName
  );

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
    // Special handling for fieldLabel - auto-generate variableName
    if (key === 'fieldLabel' && typeof value === 'string' && autoGenerateVarName) {
      const generatedVarName = transliterateToSnakeCase(value);
      onUpdate(block.id, {
        dynamicField: {
          ...block.dynamicField!,
          fieldLabel: value,
          variableName: generatedVarName
        },
      });
      return;
    }

    // Validate variable name format (manual input)
    if (key === 'variableName' && typeof value === 'string') {
      setAutoGenerateVarName(false); // Disable auto-generation when manually edited
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

  // Reset auto-generation when switching blocks or toggling dynamic
  useEffect(() => {
    setAutoGenerateVarName(true);
    setShowAdvanced(false);
  }, [block.id, isDynamic]);

  const handleOptionsChange = (optionsText: string) => {
    // Split by comma and trim, but keep empty strings to allow user to type commas
    const options = optionsText.split(',').map(opt => opt.trim());
    handleDynamicFieldChange('options', options);
  };

  const handleDependencyChange = (key: keyof FieldDependency, value: string) => {
    const currentDependency = block.dynamicField?.dependency;

    if (!value && key === 'parentVariable') {
      // Remove dependency if no parent selected
      onUpdate(block.id, {
        dynamicField: { ...block.dynamicField!, dependency: undefined },
      });
    } else {
      // Update dependency
      onUpdate(block.id, {
        dynamicField: {
          ...block.dynamicField!,
          dependency: {
            parentVariable: key === 'parentVariable' ? value : (currentDependency?.parentVariable || ''),
            expectedValue: key === 'expectedValue' ? value : (currentDependency?.expectedValue || ''),
          },
        },
      });
    }
  };

  return (
    <>
    <div className="properties-panel">
      <h3>Свойства</h3>

      {/* ============ SECTION 1: LOGIC & CONTENT ============ */}
      <div className="panel-section logic-section">
        <h4 className="section-title">⚡ Логика и содержание</h4>

        <div className="property-section">
          <label className="property-label">Тип блока</label>
          <div className="property-value">{block.type}</div>
        </div>

        {/* Segmented Control for Static/Dynamic mode - NOT for text blocks */}
        {(block.type === 'button' || block.type === 'heading' || block.type === 'image') && (
          <div className="property-section">
            <label className="property-label">Режим блока</label>
            <div className="segmented-control">
              <button
                className={`segment ${!isDynamic ? 'active' : ''}`}
                onClick={() => handleDynamicToggle(false)}
                type="button"
              >
                🔒 Статичный текст
              </button>
              <button
                className={`segment ${isDynamic ? 'active' : ''}`}
                onClick={() => handleDynamicToggle(true)}
                type="button"
              >
                ⚡ Запросить у менеджера
              </button>
            </div>
          </div>
        )}

        {/* List block removed - now part of Rich Text Editor */}

        {/* Checkbox Group and Radio Group configuration */}
        {(block.type === 'checkbox-group' || block.type === 'radio-group') && (
          <>
            <div className="property-section">
              <label className="property-label">Название группы</label>
              <input
                type="text"
                className="property-input"
                placeholder={block.type === 'checkbox-group' ? "например: Выберите услуги" : "например: Выберите один вариант"}
                value={block.dynamicField?.fieldLabel || ''}
                onChange={(e) => {
                  if (autoGenerateVarName) {
                    const generatedVarName = transliterateToSnakeCase(e.target.value);
                    onUpdate(block.id, {
                      isDynamic: true,
                      dynamicField: {
                        ...block.dynamicField!,
                        fieldLabel: e.target.value,
                        variableName: generatedVarName,
                        fieldType: 'text'
                      }
                    });
                  } else {
                    onUpdate(block.id, {
                      dynamicField: {
                        ...block.dynamicField!,
                        fieldLabel: e.target.value
                      }
                    });
                  }
                }}
              />
              <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                Этот текст увидит менеджер в форме заполнения
              </small>
            </div>

            <div className="property-section">
              <label className="property-label">Опции</label>

              {(block.groupOptions || []).length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', backgroundColor: '#F9FAFB', borderRadius: '6px', border: '1px dashed #D1D5DB' }}>
                  <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#6B7280' }}>
                    Опции не настроены
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const newOption: SelectOption = { label: 'Опция 1', value: 'Опция 1' };
                      onUpdate(block.id, { groupOptions: [newOption] });
                    }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#4F46E5',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    + Добавить первую опцию
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                    {(block.groupOptions || []).map((option, index) => (
                      <div key={index} style={{
                        padding: '12px',
                        backgroundColor: '#F9FAFB',
                        borderRadius: '6px',
                        border: '1px solid #E5E7EB'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <strong style={{ fontSize: '13px', color: '#374151' }}>{option.label || `Опция ${index + 1}`}</strong>
                          <button
                            type="button"
                            onClick={() => {
                              const newOptions = block.groupOptions?.filter((_, i) => i !== index) || [];
                              onUpdate(block.id, { groupOptions: newOptions });
                            }}
                            style={{
                              padding: '2px 8px',
                              fontSize: '12px',
                              backgroundColor: '#EF4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            ✕
                          </button>
                        </div>

                        <div style={{ marginBottom: '8px' }}>
                          <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>
                            Название (для менеджера)
                          </label>
                          <input
                            type="text"
                            className="property-input"
                            placeholder="например: Банковский перевод"
                            value={option.label}
                            onChange={(e) => {
                              const newOptions = [...(block.groupOptions || [])];
                              newOptions[index] = { ...option, label: e.target.value };
                              onUpdate(block.id, { groupOptions: newOptions });
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>
                            Текст в письмо
                          </label>
                          <textarea
                            className="property-input"
                            placeholder="например: Оплатите на счет: BE12..."
                            value={option.value}
                            onChange={(e) => {
                              const newOptions = [...(block.groupOptions || [])];
                              newOptions[index] = { ...option, value: e.target.value };
                              onUpdate(block.id, { groupOptions: newOptions });
                            }}
                            rows={3}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const newOption: SelectOption = {
                        label: `Опция ${(block.groupOptions?.length || 0) + 1}`,
                        value: `Опция ${(block.groupOptions?.length || 0) + 1}`
                      };
                      onUpdate(block.id, { groupOptions: [...(block.groupOptions || []), newOption] });
                    }}
                    style={{
                      padding: '8px 16px',
                      width: '100%',
                      backgroundColor: '#F3F4F6',
                      color: '#374151',
                      border: '1px solid #D1D5DB',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    + Добавить опцию
                  </button>
                </>
              )}

              <small style={{ color: '#666', fontSize: '12px', marginTop: '8px', display: 'block' }}>
                {block.type === 'checkbox-group'
                  ? 'Менеджер сможет выбрать несколько вариантов. В email попадет "Текст в письмо".'
                  : 'Менеджер сможет выбрать один вариант. В email попадет "Текст в письмо".'}
              </small>
            </div>

            <div className="property-section">
              <label className="property-checkbox">
                <input
                  type="checkbox"
                  checked={block.dynamicField?.required || false}
                  onChange={(e) => {
                    onUpdate(block.id, {
                      dynamicField: {
                        ...block.dynamicField!,
                        required: e.target.checked
                      }
                    });
                  }}
                />
                <span>Обязательное поле</span>
              </label>
            </div>

            {/* Advanced settings for variable name */}
            <div className="property-section">
              <button
                className="advanced-toggle"
                onClick={() => setShowAdvanced(!showAdvanced)}
                type="button"
              >
                {showAdvanced ? '▼' : '▶'} Расширенные настройки
              </button>
              {showAdvanced && (
                <div className="advanced-settings">
                  <div className="property-section">
                    <label className="property-label">ID переменной (для разработчиков)</label>
                    <input
                      type="text"
                      className="property-input"
                      placeholder="например: selected_services"
                      value={block.dynamicField?.variableName || ''}
                      onChange={(e) => {
                        setAutoGenerateVarName(false);
                        const sanitized = e.target.value.replace(/[^a-zA-Z0-9_]/g, '_');
                        onUpdate(block.id, {
                          dynamicField: {
                            ...block.dynamicField!,
                            variableName: sanitized
                          }
                        });
                      }}
                    />
                    <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      {autoGenerateVarName
                        ? '✓ Генерируется автоматически. Можно изменить вручную.'
                        : 'Только латинские буквы, цифры и подчеркивание.'
                      }
                    </small>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Table configuration */}
        {block.type === 'table' && (
          <>
            <div className="property-section">
              <label className="property-label">Название таблицы</label>
              <input
                type="text"
                className="property-input"
                placeholder="например: Список товаров"
                value={block.tableLabel || ''}
                onChange={(e) => {
                  const generatedVarName = transliterateToSnakeCase(e.target.value);
                  onUpdate(block.id, {
                    tableLabel: e.target.value,
                    tableVariableName: generatedVarName
                  });
                }}
              />
              <small style={{ color: '#9CA3AF', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                ID: {block.tableVariableName || 'auto'}
              </small>
            </div>

            <div className="property-section">
              <label className="property-label">Колонки таблицы</label>
              {(block.columns || []).map((column, index) => (
                <div key={column.id} style={{
                  backgroundColor: '#F9FAFB',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '8px',
                  border: '1px solid #E5E7EB'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong style={{ fontSize: '13px', color: '#374151' }}>Колонка {index + 1}</strong>
                    <button
                      onClick={() => {
                        const newColumns = block.columns?.filter((_, i) => i !== index) || [];
                        onUpdate(block.id, { columns: newColumns });
                      }}
                      style={{
                        padding: '2px 8px',
                        fontSize: '12px',
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

                  <div style={{ marginBottom: '8px' }}>
                    <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>
                      Заголовок колонки
                    </label>
                    <input
                      type="text"
                      className="property-input"
                      placeholder="например: Цена"
                      value={column.label}
                      onChange={(e) => {
                        const newColumns = [...(block.columns || [])];
                        const generatedVarName = transliterateToSnakeCase(e.target.value);
                        newColumns[index] = { ...column, label: e.target.value, variableName: generatedVarName };
                        onUpdate(block.id, { columns: newColumns });
                      }}
                    />
                    <small style={{ color: '#9CA3AF', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                      ID: {column.variableName || 'auto'}
                    </small>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: '#6B7280', display: 'block', marginBottom: '4px' }}>
                      Тип данных
                    </label>
                    <select
                      className="property-input"
                      value={column.type}
                      onChange={(e) => {
                        const newColumns = [...(block.columns || [])];
                        newColumns[index] = { ...column, type: e.target.value as ColumnType };
                        onUpdate(block.id, { columns: newColumns });
                      }}
                    >
                      <option value="text">Текст</option>
                      <option value="number">Число</option>
                      <option value="email">Email</option>
                      <option value="select">Выпадающий список</option>
                    </select>
                  </div>

                  {column.type === 'select' && (
                    <div style={{ marginTop: '8px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingColumnIndex(index);
                          setIsOptionsModalOpen(true);
                        }}
                        style={{
                          padding: '8px 12px',
                          width: '100%',
                          backgroundColor: '#4F46E5',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>⚙️</span>
                        <span>Настроить список ({column.options?.length || 0})</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}

              <button
                onClick={() => {
                  const newColumn: TableColumn = {
                    id: `col_${Date.now()}`,
                    label: `Колонка ${(block.columns?.length || 0) + 1}`,
                    variableName: `column_${(block.columns?.length || 0) + 1}`,
                    type: 'text'
                  };
                  const newColumns = [...(block.columns || []), newColumn];
                  onUpdate(block.id, { columns: newColumns });
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
                + Добавить колонку
              </button>
            </div>
          </>
        )}

        {/* Content editing for text blocks - Rich Text Editor with inline variables support */}
        {block.type === 'text' && (
          <div className="property-section">
            <label className="property-label">Содержимое</label>
            <RichTextEditor
              value={block.content}
              onChange={handleContentChange}
              placeholder="Введите текст. Используйте панель инструментов для форматирования."
            />
            <small style={{ color: '#666', fontSize: '12px', marginTop: '0.5rem', display: 'block' }}>
              Используйте панель инструментов для форматирования текста, списков и вставки переменных
            </small>
          </div>
        )}

        {/* Content editing for button/heading */}
        {!isDynamic && (block.type === 'button' || block.type === 'heading') && (
          <div className="property-section">
            <label className="property-label">Содержимое</label>
            <input
              type="text"
              className="property-input"
              value={block.content}
              onChange={(e) => handleContentChange(e.target.value)}
            />
          </div>
        )}

        {/* Content editing for image */}
        {!isDynamic && block.type === 'image' && (
          <div className="property-section">
            <label className="property-label">URL изображения</label>
            <input
              type="text"
              className="property-input"
              value={block.content}
              onChange={(e) => handleContentChange(e.target.value)}
            />
          </div>
        )}

        {/* Spacer block configuration */}
        {block.type === 'spacer' && (
          <>
            <div className="property-section">
              <label className="property-label">Высота отступа (px)</label>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                className="property-input"
                value={block.height || 30}
                onChange={(e) => onUpdate(block.id, { height: parseInt(e.target.value) })}
              />
              <div style={{ textAlign: 'center', fontSize: '14px', color: '#666', marginTop: '4px' }}>
                {block.height || 30} px
              </div>
            </div>

            <div className="property-section">
              <label className="property-checkbox">
                <input
                  type="checkbox"
                  checked={block.showLine || false}
                  onChange={(e) => onUpdate(block.id, { showLine: e.target.checked })}
                />
                <span>Показывать разделительную линию</span>
              </label>
              <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                Если включено, отображается горизонтальная линия-разделитель
              </small>
            </div>
          </>
        )}

        {/* Dynamic field configuration - NEW DESIGN (exclude checkbox-group and radio-group as they have their own config above) */}
        {isDynamic && block.dynamicField && block.type !== 'checkbox-group' && block.type !== 'radio-group' && (
          <div className="dynamic-fields">
            <div className="property-section">
              <label className="property-label">Название поля / Вопрос</label>
              <input
                type="text"
                className="property-input"
                placeholder="например: Имя клиента"
                value={block.dynamicField.fieldLabel}
                onChange={(e) => handleDynamicFieldChange('fieldLabel', e.target.value)}
              />
              <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                Этот текст увидит менеджер в форме заполнения
              </small>
            </div>

            {/* Only show Input Type dropdown for button, heading, and text blocks (NOT for checkbox-group, radio-group, table, image, spacer) */}
            {(block.type === 'button' || block.type === 'heading') && (
              <div className="property-section">
                <label className="property-label">Тип ввода</label>
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
            )}

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

            {/* Visibility Conditions */}
            {availableParentBlocks.length > 0 && (
              <div className="property-section visibility-conditions">
                <label className="property-label">
                  👁️ Условия видимости (необязательно)
                </label>
                <small style={{ color: '#666', fontSize: '12px', marginBottom: '0.5rem', display: 'block' }}>
                  Это поле будет показано только при определенном значении другого поля
                </small>

                <div className="property-section">
                  <label className="property-label" style={{ textTransform: 'none', fontSize: '0.75rem' }}>
                    Зависит от поля
                  </label>
                  <select
                    className="property-input"
                    value={block.dynamicField.dependency?.parentVariable || ''}
                    onChange={(e) => handleDependencyChange('parentVariable', e.target.value)}
                  >
                    <option value="">Нет зависимости</option>
                    {availableParentBlocks.map(parentBlock => (
                      <option
                        key={parentBlock.id}
                        value={parentBlock.dynamicField!.variableName}
                      >
                        {parentBlock.dynamicField!.fieldLabel || parentBlock.dynamicField!.variableName}
                      </option>
                    ))}
                  </select>
                </div>

                {block.dynamicField.dependency?.parentVariable && (
                  <div className="property-section">
                    <label className="property-label" style={{ textTransform: 'none', fontSize: '0.75rem' }}>
                      Показать, если значение равно
                    </label>
                    {(() => {
                      const parentBlock = blocks.find(
                        b => b.dynamicField?.variableName === block.dynamicField!.dependency!.parentVariable
                      );
                      const parentFieldType = parentBlock?.dynamicField?.fieldType;
                      const parentOptions = parentBlock?.dynamicField?.options;

                      // If parent is a select, show dropdown
                      if (parentFieldType === 'select' && parentOptions && parentOptions.length > 0) {
                        return (
                          <select
                            className="property-input"
                            value={block.dynamicField.dependency?.expectedValue || ''}
                            onChange={(e) => handleDependencyChange('expectedValue', e.target.value)}
                          >
                            <option value="">Выберите значение</option>
                            {parentOptions.map(option => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        );
                      }

                      // Otherwise show text input
                      return (
                        <input
                          type="text"
                          className="property-input"
                          placeholder="например: renewal"
                          value={block.dynamicField.dependency?.expectedValue || ''}
                          onChange={(e) => handleDependencyChange('expectedValue', e.target.value)}
                        />
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Advanced settings - collapsible */}
            <div className="property-section">
              <button
                className="advanced-toggle"
                onClick={() => setShowAdvanced(!showAdvanced)}
                type="button"
              >
                {showAdvanced ? '▼' : '▶'} Расширенные настройки
              </button>
              {showAdvanced && (
                <div className="advanced-settings">
                  <div className="property-section">
                    <label className="property-label">ID переменной (для разработчиков)</label>
                    <input
                      type="text"
                      className="property-input"
                      placeholder="например: client_name"
                      value={block.dynamicField.variableName}
                      onChange={(e) => handleDynamicFieldChange('variableName', e.target.value)}
                    />
                    <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      {autoGenerateVarName
                        ? '✓ Генерируется автоматически. Можно изменить вручную.'
                        : 'Только латинские буквы, цифры и подчеркивание.'
                      }
                    </small>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ============ SECTION 2: VISUAL STYLES ============ */}
      <div className="panel-section visual-section">
        <h4 className="section-title">🎨 Визуальные стили</h4>

        {/* Style editing for text/button/heading */}
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

        {/* List block removed - now part of Rich Text Editor */}

        {/* Heading specific properties */}
        {block.type === 'heading' && (
          <>
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
          </>
        )}
      </div>
    </div>

    {/* Modal for editing column select options */}
    <Modal
      isOpen={isOptionsModalOpen}
      onClose={() => {
        setIsOptionsModalOpen(false);
        setEditingColumnIndex(null);
      }}
      title="Настройка списка опций"
    >
      {editingColumnIndex !== null && block.columns && block.columns[editingColumnIndex] && (
        <div>
          <p style={{ marginBottom: '16px', fontSize: '14px', color: '#6B7280' }}>
            Настройте варианты для выпадающего списка в колонке "<strong>{block.columns[editingColumnIndex].label}</strong>"
          </p>

          {(block.columns[editingColumnIndex].options || []).length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px dashed #D1D5DB' }}>
              <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#6B7280' }}>
                Опции еще не добавлены
              </p>
              <button
                type="button"
                onClick={() => {
                  const newColumns = [...(block.columns || [])];
                  const newOption: SelectOption = { label: 'Опция 1', value: 'Опция 1' };
                  newColumns[editingColumnIndex] = {
                    ...newColumns[editingColumnIndex],
                    options: [newOption]
                  };
                  onUpdate(block.id, { columns: newColumns });
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#4F46E5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                + Добавить первую опцию
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px', maxHeight: '400px', overflowY: 'auto' }}>
                {block.columns[editingColumnIndex].options?.map((option, optIndex) => (
                  <div key={optIndex} style={{
                    padding: '16px',
                    backgroundColor: '#F9FAFB',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <strong style={{ fontSize: '14px', color: '#374151' }}>Опция {optIndex + 1}</strong>
                      <button
                        type="button"
                        onClick={() => {
                          const newColumns = [...(block.columns || [])];
                          const newOptions = newColumns[editingColumnIndex].options?.filter((_, i) => i !== optIndex) || [];
                          newColumns[editingColumnIndex] = {
                            ...newColumns[editingColumnIndex],
                            options: newOptions
                          };
                          onUpdate(block.id, { columns: newColumns });
                        }}
                        style={{
                          padding: '4px 10px',
                          fontSize: '13px',
                          backgroundColor: '#EF4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        ✕ Удалить
                      </button>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '13px', color: '#6B7280', display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                        Название (для менеджера)
                      </label>
                      <input
                        type="text"
                        className="property-input"
                        placeholder="например: Хостинг на 1 год"
                        value={option.label}
                        onChange={(e) => {
                          const newColumns = [...(block.columns || [])];
                          const newOptions = [...(newColumns[editingColumnIndex].options || [])];
                          newOptions[optIndex] = { ...option, label: e.target.value };
                          newColumns[editingColumnIndex] = {
                            ...newColumns[editingColumnIndex],
                            options: newOptions
                          };
                          onUpdate(block.id, { columns: newColumns });
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '13px', color: '#6B7280', display: 'block', marginBottom: '6px', fontWeight: '500' }}>
                        Текст в ячейку таблицы
                      </label>
                      <textarea
                        className="property-input"
                        placeholder="например: <b>Хостинг:</b> Премиум план на 12 месяцев..."
                        value={option.value}
                        onChange={(e) => {
                          const newColumns = [...(block.columns || [])];
                          const newOptions = [...(newColumns[editingColumnIndex].options || [])];
                          newOptions[optIndex] = { ...option, value: e.target.value };
                          newColumns[editingColumnIndex] = {
                            ...newColumns[editingColumnIndex],
                            options: newOptions
                          };
                          onUpdate(block.id, { columns: newColumns });
                        }}
                        rows={4}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  const newColumns = [...(block.columns || [])];
                  const currentOptions = newColumns[editingColumnIndex].options || [];
                  const newOption: SelectOption = {
                    label: `Опция ${currentOptions.length + 1}`,
                    value: `Опция ${currentOptions.length + 1}`
                  };
                  newColumns[editingColumnIndex] = {
                    ...newColumns[editingColumnIndex],
                    options: [...currentOptions, newOption]
                  };
                  onUpdate(block.id, { columns: newColumns });
                }}
                style={{
                  padding: '10px 20px',
                  width: '100%',
                  backgroundColor: '#F3F4F6',
                  color: '#374151',
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                + Добавить опцию
              </button>
            </>
          )}
        </div>
      )}
    </Modal>
    </>
  );
}

export default PropertiesPanel;

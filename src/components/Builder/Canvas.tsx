import { useState, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Block } from '../../types';
import './Canvas.css';

interface CanvasProps {
  blocks: Block[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string) => void;
  onDeleteBlock: (id: string) => void;
  onReorderBlocks: (blocks: Block[]) => void;
}

interface SortableBlockProps {
  block: Block;
  isSelected: boolean;
  isNewlyAdded: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  renderBlock: (block: Block) => React.ReactNode;
}

function SortableBlock({ block, isSelected, isNewlyAdded, onSelect, onDelete, renderBlock }: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`canvas-block ${isSelected ? 'selected' : ''} ${
        block.isDynamic ? 'dynamic' : ''
      } ${isNewlyAdded ? 'newly-added' : ''}`}
      onClick={() => onSelect(block.id)}
    >
      {block.isDynamic && (
        <div className="dynamic-badge" title="Динамический блок - будет заполнен менеджером">
          ⚡
        </div>
      )}
      {block.isDynamic && block.dynamicField?.dependency && (
        <div
          className="dependency-badge"
          title={`Видимо только когда ${
            block.dynamicField.dependency.parentVariable
          } = ${block.dynamicField.dependency.expectedValue}`}
        >
          👁️
        </div>
      )}
      {renderBlock(block)}
      <button
        className="delete-button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(block.id);
        }}
      >
        ✕
      </button>
    </div>
  );
}

function Canvas({ blocks, selectedBlockId, onSelectBlock, onDeleteBlock }: CanvasProps) {
  const [newlyAddedBlockIds, setNewlyAddedBlockIds] = useState<Set<string>>(new Set());
  const [previousBlockCount, setPreviousBlockCount] = useState(blocks.length);

  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-droppable',
  });

  // Detect when a new block is added
  useEffect(() => {
    if (blocks.length > previousBlockCount) {
      // Find the newly added block (the last one)
      const newBlock = blocks[blocks.length - 1];
      if (newBlock) {
        // Add to newly added set
        setNewlyAddedBlockIds(prev => new Set(prev).add(newBlock.id));

        // Remove from set after animation completes
        setTimeout(() => {
          setNewlyAddedBlockIds(prev => {
            const next = new Set(prev);
            next.delete(newBlock.id);
            return next;
          });
        }, 500);
      }
    }
    setPreviousBlockCount(blocks.length);
  }, [blocks, previousBlockCount]);
  const renderBlock = (block: Block) => {
    switch (block.type) {
      case 'text': {
        // Process HTML content with inline variables styling
        const processHtmlWithVariables = (html: string) => {
          // Replace {{variable}} patterns with styled spans for display
          return html.replace(/\{\{([^}]+)\}\}/g, (match) => {
            return `<span class="inline-variable" contenteditable="false">${match}</span>`;
          });
        };

        return (
          <div
            style={{
              fontSize: block.styles?.fontSize,
              color: block.styles?.color,
              textAlign: block.styles?.textAlign,
              padding: block.styles?.padding,
            }}
            dangerouslySetInnerHTML={{ __html: processHtmlWithVariables(block.content) }}
          />
        );
      }

      case 'image':
        return (
          <div style={{ textAlign: 'center', padding: '10px' }}>
            {block.isDynamic ? (
              <div className="dynamic-placeholder">
                {`{{${block.dynamicField?.variableName}}}`}
              </div>
            ) : (
              <img
                src={block.content}
                alt="Email content"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            )}
          </div>
        );

      case 'button':
        return (
          <div style={{ textAlign: 'center', padding: '10px' }}>
            <button
              style={{
                fontSize: block.styles?.fontSize,
                color: block.styles?.color,
                backgroundColor: block.styles?.backgroundColor,
                padding: block.styles?.padding,
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {block.isDynamic ? `{{${block.dynamicField?.variableName}}}` : block.content}
            </button>
          </div>
        );

      case 'divider':
        // Backward compatibility - old divider blocks
        return (
          <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #ddd' }} />
        );

      case 'spacer': {
        const height = block.height || 30;
        const showLine = block.showLine || false;

        if (showLine) {
          // Render as divider with height
          const topMargin = Math.floor(height / 2);
          const bottomMargin = height - topMargin;
          return (
            <hr style={{
              margin: `${topMargin}px 0 ${bottomMargin}px 0`,
              border: 'none',
              borderTop: '1px solid #ddd'
            }} />
          );
        } else {
          // Render as simple spacer
          return <div style={{ height: `${height}px` }} />;
        }
      }

      case 'heading':
        const HeadingTag = block.styles?.level || 'h2';
        return (
          <HeadingTag
            style={{
              fontSize: block.styles?.fontSize,
              color: block.styles?.color,
              textAlign: block.styles?.textAlign,
              padding: block.styles?.padding,
              fontWeight: block.styles?.fontWeight,
              margin: 0,
            }}
          >
            {block.isDynamic ? (
              <span className="dynamic-placeholder">
                {`{{${block.dynamicField?.variableName}}}`}
              </span>
            ) : (
              block.content
            )}
          </HeadingTag>
        );

      // List block removed - now part of Rich Text Editor

      case 'table': {
        const columns = block.columns || [];
        const tableVarName = block.tableVariableName || 'table_data';
        const tableLabel = block.tableLabel || 'Таблица';

        return (
          <div style={{ padding: '10px' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
              {tableLabel}
            </div>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: '1px solid #E5E7EB'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#F9FAFB' }}>
                  {columns.length > 0 ? (
                    columns.map((col) => (
                      <th
                        key={col.id}
                        style={{
                          padding: '8px',
                          textAlign: 'left',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#6B7280',
                          border: '1px solid #E5E7EB'
                        }}
                      >
                        {col.label}
                      </th>
                    ))
                  ) : (
                    <th
                      style={{
                        padding: '8px',
                        textAlign: 'center',
                        fontSize: '12px',
                        color: '#9CA3AF',
                        border: '1px solid #E5E7EB'
                      }}
                    >
                      Настройте колонки в панели свойств →
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {columns.length > 0 ? (
                    columns.map((col) => (
                      <td
                        key={col.id}
                        style={{
                          padding: '8px',
                          fontSize: '12px',
                          color: '#6B7280',
                          border: '1px solid #E5E7EB'
                        }}
                      >
                        <span className="dynamic-placeholder">
                          {`{{${col.variableName}}}`}
                        </span>
                      </td>
                    ))
                  ) : (
                    <td style={{ padding: '16px', textAlign: 'center', border: '1px solid #E5E7EB' }}>
                      <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
                        Пример строки
                      </span>
                    </td>
                  )}
                </tr>
              </tbody>
            </table>
            <div style={{
              fontSize: '11px',
              color: '#9CA3AF',
              marginTop: '4px',
              fontStyle: 'italic'
            }}>
              Цикл: {`{{#each ${tableVarName}}} ... {{/each}}`}
            </div>
          </div>
        );
      }

      case 'checkbox-group': {
        const options = block.groupOptions || [];
        const label = block.dynamicField?.fieldLabel || 'Множественный выбор';
        const varName = block.dynamicField?.variableName || 'checkbox_group';

        return (
          <div style={{ padding: '10px' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
              {label}
            </div>
            {options.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {options.map((option, index) => (
                  <label
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      color: '#374151',
                      cursor: 'pointer'
                    }}
                  >
                    <input type="checkbox" disabled style={{ cursor: 'pointer' }} />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: '#9CA3AF', fontStyle: 'italic' }}>
                Настройте опции в панели свойств →
              </div>
            )}
            {block.isDynamic && (
              <div style={{
                fontSize: '11px',
                color: '#9CA3AF',
                marginTop: '4px',
                fontStyle: 'italic'
              }}>
                Переменная: {`{{${varName}}}`} (массив)
              </div>
            )}
          </div>
        );
      }

      case 'radio-group': {
        const options = block.groupOptions || [];
        const label = block.dynamicField?.fieldLabel || 'Одиночный выбор';
        const varName = block.dynamicField?.variableName || 'radio_group';

        return (
          <div style={{ padding: '10px' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
              {label}
            </div>
            {options.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {options.map((option, index) => (
                  <label
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      color: '#374151',
                      cursor: 'pointer'
                    }}
                  >
                    <input type="radio" name={`preview-${block.id}`} disabled style={{ cursor: 'pointer' }} />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: '#9CA3AF', fontStyle: 'italic' }}>
                Настройте опции в панели свойств →
              </div>
            )}
            {block.isDynamic && (
              <div style={{
                fontSize: '11px',
                color: '#9CA3AF',
                marginTop: '4px',
                fontStyle: 'italic'
              }}>
                Переменная: {`{{${varName}}}`} (строка)
              </div>
            )}
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="canvas">
      <h3>Email Preview</h3>
      <div ref={setNodeRef} className={`canvas-content ${isOver ? 'drag-over' : ''}`}>
        {blocks.length === 0 ? (
          <div className="canvas-empty">
            <p>Перетащите блоки из левого меню или нажмите на них</p>
          </div>
        ) : (
          <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
            {blocks.map(block => (
              <SortableBlock
                key={block.id}
                block={block}
                isSelected={selectedBlockId === block.id}
                isNewlyAdded={newlyAddedBlockIds.has(block.id)}
                onSelect={onSelectBlock}
                onDelete={onDeleteBlock}
                renderBlock={renderBlock}
              />
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  );
}

export default Canvas;

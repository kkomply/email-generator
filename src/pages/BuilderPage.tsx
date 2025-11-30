import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import BlockList from '../components/Builder/BlockList';
import Canvas from '../components/Builder/Canvas';
import PropertiesPanel from '../components/Builder/PropertiesPanel';
import ExportButton from '../components/Builder/ExportButton';
import type { Block, BlockType, SelectOption } from '../types';
import './BuilderPage.css';

function BuilderPage() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const selectedBlock = blocks.find(block => block.id === selectedBlockId);

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const addBlock = (type: Block['type']) => {
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      type,
      content: getDefaultContent(type),
      groupOptions: (type === 'checkbox-group' || type === 'radio-group') ? [] as SelectOption[] : undefined,
      showLine: type === 'spacer' ? false : undefined,
      height: type === 'spacer' ? 30 : undefined,
      isDynamic: (type === 'checkbox-group' || type === 'radio-group') ? true : false,
      dynamicField: (type === 'checkbox-group' || type === 'radio-group') ? {
        variableName: '',
        fieldLabel: '',
        fieldType: 'text',
        required: false
      } : undefined,
      styles: getDefaultStyles(type),
    };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id: string, updates: Partial<Block>) => {
    setBlocks(blocks.map(block =>
      block.id === id ? { ...block, ...updates } : block
    ));
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter(block => block.id !== id));
    if (selectedBlockId === id) {
      setSelectedBlockId(null);
    }
  };

  const getDefaultContent = (type: Block['type']): string => {
    switch (type) {
      case 'text':
        return '<p>Введите ваш текст здесь</p>';
      case 'image':
        return 'https://via.placeholder.com/600x200';
      case 'button':
        return 'Нажмите';
      case 'spacer':
        return '';
      case 'heading':
        return 'Заголовок раздела';
      default:
        return '';
    }
  };

  const getDefaultStyles = (type: Block['type']) => {
    switch (type) {
      case 'text':
        return { fontSize: '16px', color: '#000000', textAlign: 'left' as const, padding: '10px' };
      case 'button':
        return { fontSize: '16px', color: '#ffffff', backgroundColor: '#007bff', padding: '10px 20px' };
      case 'heading':
        return { fontSize: '24px', color: '#111827', textAlign: 'left' as const, padding: '10px', fontWeight: '700', level: 'h2' as const };
      default:
        return {};
    }
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // Check if dragging from BlockList to Canvas
    if (active.id.toString().startsWith('blocklist-')) {
      const blockType = active.id.toString().replace('blocklist-', '') as BlockType;
      const newBlock: Block = {
        id: `block-${Date.now()}`,
        type: blockType,
        content: getDefaultContent(blockType),
        groupOptions: (blockType === 'checkbox-group' || blockType === 'radio-group') ? [] as SelectOption[] : undefined,
        showLine: blockType === 'spacer' ? false : undefined,
        height: blockType === 'spacer' ? 30 : undefined,
        isDynamic: (blockType === 'checkbox-group' || blockType === 'radio-group') ? true : false,
        dynamicField: (blockType === 'checkbox-group' || blockType === 'radio-group') ? {
          variableName: '',
          fieldLabel: '',
          fieldType: 'text',
          required: false
        } : undefined,
        styles: getDefaultStyles(blockType),
      };
      setBlocks([...blocks, newBlock]);
      return;
    }

    // Check if reordering blocks on Canvas
    if (active.id !== over.id) {
      const oldIndex = blocks.findIndex((block) => block.id === active.id);
      const newIndex = blocks.findIndex((block) => block.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        setBlocks(arrayMove(blocks, oldIndex, newIndex));
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="builder-page">
        <header className="builder-header">
          <h1>Конструктор Email (Режим администратора)</h1>
          <div className="header-actions">
            <Link to="/renderer" className="nav-link">Перейти к Рендереру</Link>
            <ExportButton blocks={blocks} />
          </div>
        </header>

        <div className="builder-content">
          <aside className="builder-sidebar">
            <BlockList onAddBlock={addBlock} />
          </aside>

          <main className="builder-main">
            <Canvas
              blocks={blocks}
              selectedBlockId={selectedBlockId}
              onSelectBlock={setSelectedBlockId}
              onDeleteBlock={deleteBlock}
              onReorderBlocks={setBlocks}
            />
          </main>

          <aside className="builder-properties">
            {selectedBlock ? (
              <PropertiesPanel
                block={selectedBlock}
                blocks={blocks}
                onUpdate={updateBlock}
              />
            ) : (
              <div className="no-selection">
                <p>Выберите блок для редактирования его свойств</p>
              </div>
            )}
          </aside>
        </div>
      </div>

      <DragOverlay>
        {activeId && activeId.startsWith('blocklist-') ? (
          <div style={{
            padding: '12px 16px',
            background: '#4F46E5',
            color: 'white',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            cursor: 'grabbing'
          }}>
            {activeId.replace('blocklist-', '')}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default BuilderPage;

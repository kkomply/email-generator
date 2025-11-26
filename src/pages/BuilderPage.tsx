import { useState } from 'react';
import { Link } from 'react-router-dom';
import BlockList from '../components/Builder/BlockList';
import Canvas from '../components/Builder/Canvas';
import PropertiesPanel from '../components/Builder/PropertiesPanel';
import ExportButton from '../components/Builder/ExportButton';
import type { Block } from '../types';
import './BuilderPage.css';

function BuilderPage() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const selectedBlock = blocks.find(block => block.id === selectedBlockId);

  const addBlock = (type: Block['type']) => {
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      type,
      content: getDefaultContent(type),
      isDynamic: false,
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
        return 'Введите ваш текст здесь';
      case 'image':
        return 'https://via.placeholder.com/600x200';
      case 'button':
        return 'Нажмите';
      case 'divider':
        return '';
      case 'spacer':
        return '';
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
      default:
        return {};
    }
  };

  return (
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
  );
}

export default BuilderPage;

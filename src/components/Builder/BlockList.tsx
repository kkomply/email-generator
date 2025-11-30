import { useDraggable } from '@dnd-kit/core';
import type { Block } from '../../types';
import './BlockList.css';

interface BlockListProps {
  onAddBlock: (type: Block['type']) => void;
}

interface DraggableBlockItemProps {
  type: Block['type'];
  label: string;
  icon: string;
  onClick: () => void;
}

function DraggableBlockItem({ type, label, icon, onClick }: DraggableBlockItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `blocklist-${type}`,
  });

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="block-item"
      onClick={onClick}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      <span className="block-icon">{icon}</span>
      <span className="block-label">{label}</span>
    </button>
  );
}

function BlockList({ onAddBlock }: BlockListProps) {
  const blockTypes: Array<{ type: Block['type']; label: string; icon: string }> = [
    { type: 'heading', label: 'Заголовок', icon: '📰' },
    { type: 'text', label: 'Текстовый блок', icon: '📝' },
    { type: 'checkbox-group', label: 'Множественный выбор', icon: '☑️' },
    { type: 'radio-group', label: 'Одиночный выбор', icon: '🔘' },
    { type: 'table', label: 'Динамическая таблица', icon: '📊' },
    { type: 'spacer', label: 'Отступ / Разделитель', icon: '⬜' },
    { type: 'button', label: 'Кнопка', icon: '🔘' },
    { type: 'image', label: 'Блок с изображением', icon: '🖼️' },
    // List block removed - now part of Rich Text Editor
    // Divider block removed - merged into Spacer block
  ];

  return (
    <div className="block-list">
      <h3>Блоки</h3>
      <p className="block-list-description">Нажмите или перетащите на холст</p>

      <div className="block-items">
        {blockTypes.map(({ type, label, icon }) => (
          <DraggableBlockItem
            key={type}
            type={type}
            label={label}
            icon={icon}
            onClick={() => onAddBlock(type)}
          />
        ))}
      </div>
    </div>
  );
}

export default BlockList;

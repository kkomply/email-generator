import type { Block } from '../../types';
import './BlockList.css';

interface BlockListProps {
  onAddBlock: (type: Block['type']) => void;
}

function BlockList({ onAddBlock }: BlockListProps) {
  const blockTypes: Array<{ type: Block['type']; label: string; icon: string }> = [
    { type: 'text', label: 'Текстовый блок', icon: '📝' },
    { type: 'image', label: 'Блок с изображением', icon: '🖼️' },
    { type: 'button', label: 'Кнопка', icon: '🔘' },
    { type: 'divider', label: 'Разделитель', icon: '➖' },
    { type: 'spacer', label: 'Отступ', icon: '⬜' },
    { type: 'heading', label: 'Заголовок', icon: '📰' },
    { type: 'list', label: 'Список', icon: '📋' },
  ];

  return (
    <div className="block-list">
      <h3>Блоки</h3>
      <p className="block-list-description">Нажмите, чтобы добавить блок</p>

      <div className="block-items">
        {blockTypes.map(({ type, label, icon }) => (
          <button
            key={type}
            className="block-item"
            onClick={() => onAddBlock(type)}
          >
            <span className="block-icon">{icon}</span>
            <span className="block-label">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default BlockList;

import type { Block } from '../../types';
import './Canvas.css';

interface CanvasProps {
  blocks: Block[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string) => void;
  onDeleteBlock: (id: string) => void;
  onReorderBlocks: (blocks: Block[]) => void;
}

function Canvas({ blocks, selectedBlockId, onSelectBlock, onDeleteBlock }: CanvasProps) {
  const renderBlock = (block: Block) => {
    switch (block.type) {
      case 'text':
        return (
          <div
            style={{
              fontSize: block.styles?.fontSize,
              color: block.styles?.color,
              textAlign: block.styles?.textAlign,
              padding: block.styles?.padding,
            }}
          >
            {block.isDynamic ? (
              <span className="dynamic-placeholder">
                {`{{${block.dynamicField?.variableName}}}`}
              </span>
            ) : (
              block.content
            )}
          </div>
        );

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
        return (
          <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #ddd' }} />
        );

      case 'spacer':
        return <div style={{ height: '30px' }} />;

      default:
        return null;
    }
  };

  return (
    <div className="canvas">
      <h3>Email Preview</h3>
      <div className="canvas-content">
        {blocks.length === 0 ? (
          <div className="canvas-empty">
            <p>Add blocks from the sidebar to start building your email</p>
          </div>
        ) : (
          blocks.map(block => (
            <div
              key={block.id}
              className={`canvas-block ${selectedBlockId === block.id ? 'selected' : ''} ${
                block.isDynamic ? 'dynamic' : ''
              }`}
              onClick={() => onSelectBlock(block.id)}
            >
              {renderBlock(block)}
              <button
                className="delete-button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteBlock(block.id);
                }}
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Canvas;

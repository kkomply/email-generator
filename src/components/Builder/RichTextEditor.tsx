import { useRef, useEffect, useState } from 'react';
import './RichTextEditor.css';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  onInsertVariable?: () => void;
  placeholder?: string;
}

function RichTextEditor({ value, onChange, onInsertVariable, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showToolbar, setShowToolbar] = useState(false);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  // Handle content changes
  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  // Handle paste - clean up formatting
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  // Handle focus - show toolbar
  const handleFocus = () => {
    setShowToolbar(true);
  };

  // Handle blur - hide toolbar (with delay to allow toolbar clicks)
  const handleBlur = () => {
    setTimeout(() => {
      setShowToolbar(false);
    }, 200);
  };

  // Execute formatting command
  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  // Insert link
  const handleInsertLink = () => {
    const url = prompt('Введите URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  // Insert variable at cursor
  const handleInsertVariable = () => {
    if (onInsertVariable) {
      onInsertVariable();
    } else {
      const label = prompt('Название переменной (например: Имя клиента):');
      if (label && label.trim()) {
        const variableHtml = `<span class="inline-variable" contenteditable="false">{{${label.trim()}}}</span>`;
        execCommand('insertHTML', variableHtml);
      }
    }
  };

  return (
    <div className="rich-text-editor-container">
      {showToolbar && (
        <div className="rich-text-toolbar">
          <button
            type="button"
            className="toolbar-btn"
            onClick={() => execCommand('bold')}
            title="Жирный (Ctrl+B)"
          >
            <strong>B</strong>
          </button>

          <button
            type="button"
            className="toolbar-btn"
            onClick={() => execCommand('italic')}
            title="Курсив (Ctrl+I)"
          >
            <em>I</em>
          </button>

          <div className="toolbar-separator"></div>

          <button
            type="button"
            className="toolbar-btn"
            onClick={() => execCommand('insertUnorderedList')}
            title="Маркированный список"
          >
            •
          </button>

          <button
            type="button"
            className="toolbar-btn"
            onClick={() => execCommand('insertOrderedList')}
            title="Нумерованный список"
          >
            1.
          </button>

          <div className="toolbar-separator"></div>

          <button
            type="button"
            className="toolbar-btn"
            onClick={handleInsertLink}
            title="Вставить ссылку"
          >
            🔗
          </button>
        </div>
      )}

      <div
        ref={editorRef}
        className="rich-text-editor"
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        onFocus={handleFocus}
        onBlur={handleBlur}
        data-placeholder={placeholder || 'Введите текст...'}
        suppressContentEditableWarning
      />

      <button
        type="button"
        className="insert-variable-btn"
        onClick={handleInsertVariable}
        style={{
          marginTop: '8px',
          padding: '8px 12px',
          backgroundColor: '#F3F4F6',
          border: '1px solid #D1D5DB',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: '500',
          color: '#374151',
          cursor: 'pointer',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          transition: 'all 0.15s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#E5E7EB';
          e.currentTarget.style.borderColor = '#9CA3AF';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#F3F4F6';
          e.currentTarget.style.borderColor = '#D1D5DB';
        }}
      >
        <span>+ место для заполнения</span>
      </button>
      <small style={{ color: '#6B7280', fontSize: '11px', marginTop: '4px', display: 'block', fontStyle: 'italic' }}>
        Это поле будет заполнять менеджер при создании письма
      </small>
    </div>
  );
}

export default RichTextEditor;

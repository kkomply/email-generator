import { useEffect, useState } from 'react';
import Handlebars from 'handlebars';
import './EmailPreview.css';

interface EmailPreviewProps {
  template: string;
  formData: Record<string, any>;
}

function EmailPreview({ template, formData }: EmailPreviewProps) {
  const [renderedHtml, setRenderedHtml] = useState<string>('');

  useEffect(() => {
    if (!template) return;

    try {
      const compiledTemplate = Handlebars.compile(template);
      const result = compiledTemplate(formData);
      setRenderedHtml(result);
    } catch (error) {
      console.error('Ошибка рендеринга шаблона:', error);
      setRenderedHtml('<p>Ошибка рендеринга шаблона</p>');
    }
  }, [template, formData]);

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(renderedHtml).then(() => {
      alert('HTML письма скопирован в буфер обмена!');
    });
  };

  return (
    <div className="email-preview">
      <div className="email-preview-header">
        <h2>Предпросмотр письма</h2>
        <button className="copy-button" onClick={handleCopyToClipboard}>
          Копировать HTML
        </button>
      </div>
      <div className="email-preview-content">
        <iframe
          srcDoc={renderedHtml}
          title="Предпросмотр письма"
          style={{
            width: '100%',
            height: '100%',
            border: '1px solid #ddd',
            backgroundColor: '#fff',
          }}
        />
      </div>
    </div>
  );
}

export default EmailPreview;

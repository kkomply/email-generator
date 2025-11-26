import { useState } from 'react';
import { Link } from 'react-router-dom';
import FormRenderer from '../components/Renderer/FormRenderer';
import EmailPreview from '../components/Renderer/EmailPreview';
import type { JSONSchema } from '../types';
import './RendererPage.css';

function RendererPage() {
  const [schema, setSchema] = useState<JSONSchema | null>(null);
  const [template, setTemplate] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loadingStatus, setLoadingStatus] = useState<string>('');

  const handleLoadTemplate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setLoadingStatus('Загрузка файлов...');

    const fileArray = Array.from(files);
    // Handle files with or without browser-added numbers like "schema (2).json"
    const schemaFile = fileArray.find(f =>
      f.name === 'schema.json' || f.name.match(/^schema(\s*\(\d+\))?\.json$/)
    );
    const templateFile = fileArray.find(f =>
      f.name === 'template.html' || f.name.match(/^template(\s*\(\d+\))?\.html$/)
    );

    console.log('Выбраны файлы:', fileArray.map(f => f.name));
    console.log('Файл schema найден:', !!schemaFile, schemaFile?.name);
    console.log('Файл template найден:', !!templateFile, templateFile?.name);

    let schemaLoaded = false;
    let templateLoaded = false;

    if (!schemaFile) {
      setLoadingStatus('Ошибка: файл schema.json не найден. Пожалуйста, выберите оба файла.');
      return;
    }

    if (!templateFile) {
      setLoadingStatus('Ошибка: файл template.html не найден. Пожалуйста, выберите оба файла.');
      return;
    }

    if (schemaFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const loadedSchema = JSON.parse(e.target?.result as string);
          console.log('Schema загружена:', loadedSchema);
          setSchema(loadedSchema);
          schemaLoaded = true;
          if (schemaLoaded && templateLoaded) {
            setLoadingStatus('Оба файла успешно загружены!');
          }
        } catch (error) {
          console.error('Ошибка парсинга schema:', error);
          setLoadingStatus('Ошибка загрузки schema.json - некорректный формат JSON');
        }
      };
      reader.readAsText(schemaFile);
    }

    if (templateFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const loadedTemplate = e.target?.result as string;
        console.log('Template загружен, длина:', loadedTemplate.length);
        setTemplate(loadedTemplate);
        templateLoaded = true;
        if (schemaLoaded && templateLoaded) {
          setLoadingStatus('Оба файла успешно загружены!');
        }
      };
      reader.readAsText(templateFile);
    }
  };

  return (
    <div className="renderer-page">
      <header className="renderer-header">
        <h1>Рендерер Email (Режим пользователя)</h1>
        <Link to="/builder" className="nav-link">Перейти к Конструктору</Link>
      </header>

      <div className="renderer-content">
        {!schema ? (
          <div className="upload-section">
            <h2>Загрузка шаблона</h2>
            <p>Пожалуйста, загрузите оба файла: <code>schema.json</code> и <code>template.html</code></p>
            <input
              type="file"
              multiple
              accept=".json,.html"
              onChange={handleLoadTemplate}
            />
            {loadingStatus && (
              <div className={`loading-status ${loadingStatus.includes('Ошибка') ? 'error' : 'success'}`}>
                {loadingStatus}
              </div>
            )}
          </div>
        ) : (
          <div className="renderer-split">
            <aside className="renderer-form">
              <h2>Заполните форму</h2>
              <FormRenderer
                schema={schema}
                formData={formData}
                onChange={setFormData}
              />
            </aside>

            <main className="renderer-preview">
              <EmailPreview
                template={template}
                formData={formData}
              />
            </main>
          </div>
        )}
      </div>
    </div>
  );
}

export default RendererPage;

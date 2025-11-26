import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import type { JSONSchema } from '../../types';
import './FormRenderer.css';

interface FormRendererProps {
  schema: JSONSchema;
  formData: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
}

function FormRenderer({ schema, formData, onChange }: FormRendererProps) {
  const handleChange = (data: any) => {
    onChange(data.formData);
  };

  return (
    <div className="form-renderer">
      <Form
        schema={schema}
        formData={formData}
        validator={validator}
        onChange={handleChange}
        onSubmit={(data) => console.log('Form submitted:', data.formData)}
      >
        <button type="submit" style={{ display: 'none' }}>Submit</button>
      </Form>
    </div>
  );
}

export default FormRenderer;

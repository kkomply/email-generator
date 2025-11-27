// Block types
export type BlockType = 'text' | 'image' | 'button' | 'divider' | 'spacer' | 'heading' | 'list';

// Field types for dynamic fields
export type FieldType = 'text' | 'number' | 'email' | 'select' | 'checkbox' | 'textarea';

// Dynamic field configuration
export interface DynamicField {
  variableName: string;
  fieldLabel: string;
  fieldType: FieldType;
  required?: boolean;
  options?: string[];
  defaultValue?: string | number | boolean;
}

// Base block interface
export interface Block {
  id: string;
  type: BlockType;
  content: string;
  listItems?: string[];
  isDynamic: boolean;
  dynamicField?: DynamicField;
  styles?: {
    fontSize?: string;
    color?: string;
    textAlign?: 'left' | 'center' | 'right';
    padding?: string;
    backgroundColor?: string;
    fontWeight?: string;
    level?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    listType?: 'ul' | 'ol';
    listStyle?: 'disc' | 'circle' | 'square' | 'decimal' | 'lower-alpha' | 'upper-alpha' | 'lower-roman' | 'upper-roman';
  };
}

// JSON Schema types
export interface JSONSchemaProperty {
  type: string;
  title: string;
  default?: any;
  enum?: string[];
}

export interface JSONSchema {
  type: 'object';
  properties: Record<string, JSONSchemaProperty>;
  required: string[];
}

// Template export
export interface TemplateExport {
  html: string;
  schema: JSONSchema;
}

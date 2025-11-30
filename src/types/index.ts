// Block types
export type BlockType = 'text' | 'image' | 'button' | 'divider' | 'spacer' | 'heading' | 'list' | 'table' | 'checkbox-group' | 'radio-group';

// Field types for dynamic fields
export type FieldType = 'text' | 'number' | 'email' | 'select' | 'checkbox' | 'textarea';

// Column types for table blocks
export type ColumnType = 'text' | 'number' | 'email' | 'select';

// Option for select fields (label/value pairs)
export interface SelectOption {
  label: string;  // What manager sees
  value: string;  // What goes into email
}

// Table column configuration
export interface TableColumn {
  id: string;
  label: string;
  variableName: string;
  type: ColumnType;
  options?: SelectOption[];  // For select type columns
}

// Dependency configuration for conditional visibility
export interface FieldDependency {
  parentVariable: string; // Variable name of the parent field
  expectedValue: string;  // Value that triggers visibility
}

// Dynamic field configuration
export interface DynamicField {
  variableName: string;
  fieldLabel: string;
  fieldType: FieldType;
  required?: boolean;
  options?: string[];
  defaultValue?: string | number | boolean;
  dependency?: FieldDependency; // Optional conditional visibility
}

// Base block interface
export interface Block {
  id: string;
  type: BlockType;
  content: string;
  listItems?: string[];
  columns?: TableColumn[]; // For table blocks
  tableVariableName?: string; // For table blocks
  tableLabel?: string; // For table blocks
  groupOptions?: SelectOption[]; // For checkbox-group and radio-group blocks (label/value pairs)
  showLine?: boolean; // For spacer blocks - whether to show a divider line
  height?: number; // For spacer blocks - height in pixels
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

export interface JSONSchemaDependency {
  oneOf: {
    properties: Record<string, { const: string }>;
    required?: string[];
  }[];
}

export interface JSONSchema {
  type: 'object';
  properties: Record<string, JSONSchemaProperty>;
  required: string[];
  dependencies?: Record<string, JSONSchemaDependency>;
  allOf?: any[]; // For conditional logic with if-then
}

// UI Schema types for RJSF
export interface UISchema {
  [key: string]: {
    'ui:widget'?: string;
    [key: string]: any;
  };
}

// Template export
export interface TemplateExport {
  html: string;
  schema: JSONSchema;
  uiSchema?: UISchema;
}

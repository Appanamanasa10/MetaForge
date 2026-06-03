export type FieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'number'
  | 'select'
  | 'checkbox'
  | 'date';

export interface FieldDefinition {
  name: string;
  type: FieldType | string;
  required?: boolean;
  options?: string[]; // For select type
  placeholder?: string;
  defaultValue?: string | number | boolean;
}

export interface EntitySchema {
  entity: string;
  fields: FieldDefinition[];
}

export interface AppConfig {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  ownerId: string;
}

export interface EntityConfig {
  id: string;
  applicationId: string;
  name: string;
  schemaJson: EntitySchema;
  createdAt: Date;
}

export interface RecordConfig {
  id: string;
  entityId: string;
  dataJson: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowConfig {
  id: string;
  applicationId: string;
  triggerType: 'RECORD_CREATED' | 'RECORD_UPDATED' | 'RECORD_DELETED';
  actionType: 'NOTIFICATION' | 'AUDIT_LOG';
  configurationJson: {
    messageTemplate: string;
    titleTemplate?: string;
  };
  createdAt: Date;
}

export interface NotificationConfig {
  id: string;
  userId: string;
  title: string;
  message: string;
  readStatus: boolean;
  createdAt: Date;
}

export interface AuditLogConfig {
  id: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: any;
  createdAt: Date;
}

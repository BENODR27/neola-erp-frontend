export interface MmmsStoredFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  organizationId: string;
  factoryId: string;
  url: string;
  category?: string;
}

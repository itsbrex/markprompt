import { NangoIntegrationId } from '@/types/types';

export type SalesforceEnvironment = 'production' | 'sandbox';
export type SalesforceDatabaseType = 'knowledge' | 'case';

export type SalesforceNangoMetadata = {
  customFields: string[] | undefined;
  filters: string | undefined;
  mappings: {
    title: string | undefined;
    content: string | undefined;
    path: string | undefined;
  };
  metadataFields: string[] | undefined;
};

export const getSalesforceDatabaseIntegrationId = (
  databaseType: SalesforceDatabaseType,
  environment: SalesforceEnvironment,
): NangoIntegrationId => {
  switch (databaseType) {
    case 'knowledge':
      return environment === 'production'
        ? 'salesforce-knowledge'
        : 'salesforce-knowledge-sandbox';
    case 'case':
      return environment === 'production'
        ? 'salesforce-case'
        : 'salesforce-case-sandbox';
  }
};

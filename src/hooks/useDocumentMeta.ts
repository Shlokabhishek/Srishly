import * as React from 'react';

import { APP_NAME } from '@/constants';

export function useDocumentMeta(title: string, description: string) {
  React.useEffect(() => {
    const previousTitle = document.title;
    const metaDescription = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previousDescription = metaDescription?.content;

    document.title = `${title} | ${APP_NAME}`;

    if (metaDescription) {
      metaDescription.content = description;
    }

    return () => {
      document.title = previousTitle;

      if (metaDescription && previousDescription) {
        metaDescription.content = previousDescription;
      }
    };
  }, [description, title]);
}

/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

import { createRoot } from 'react-dom/client';
import { unstableSetCreateRoot } from '@flowgram.ai/form-materials';

import { installUITranslation } from './ui-translation';
import { Editor } from './editor';

/**
 * React 18/19 polyfill for form-materials
 */
unstableSetCreateRoot(createRoot);

const app = createRoot(document.getElementById('root')!);

app.render(<Editor />);

const translation = installUITranslation(document);
window.addEventListener('message', (event) => {
  if (
    event.origin === window.location.origin &&
    event.source === window.parent &&
    event.data?.type === 'flowgram:translation' &&
    typeof event.data.enabled === 'boolean'
  ) {
    translation.setEnabled(event.data.enabled);
  }
});

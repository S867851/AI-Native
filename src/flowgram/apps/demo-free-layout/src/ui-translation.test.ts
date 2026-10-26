/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';

import { installUITranslation } from './ui-translation';

describe('system-only bilingual presentation', () => {
  it('preserves editable values, user names, original text and mounted elements', () => {
    document.body.innerHTML =
      '<button>Test Run</button><div data-user-content>Test Run</div>' +
      '<input placeholder="Select Variable" value="Test Run"><pre>Test Run</pre>' +
      '<div contenteditable="true">Test Run</div><div class="gedit-m-variable-selector-var-name">Add</div>' +
      '<div id="branch-label">if *</div><div class="gedit-m-display-outputs-wrapper">Add</div>';
    const button = document.querySelector('button')!;
    const input = document.querySelector('input')!;
    const translator = installUITranslation(document);
    translator.setEnabled(true);
    expect(button.getAttribute('data-ui-translation')).toBe('试运行');
    expect(button.textContent).toBe('Test Run');
    expect(input.value).toBe('Test Run');
    expect(input.placeholder).toBe('Select Variable（选择变量）');
    expect(document.querySelector('#branch-label')!.getAttribute('data-ui-translation')).toBe(
      '如果'
    );
    expect(document.querySelectorAll('[data-ui-translation]').length).toBe(2);
    translator.setEnabled(false);
    expect(input.placeholder).toBe('Select Variable');
    expect(document.querySelector('button')).toBe(button);
    translator.dispose();
    expect(document.querySelector('[data-ui-translation]')).toBeNull();
  });
  it('annotates newly opened system menus without altering their text', async () => {
    document.body.innerHTML = '';
    const translator = installUITranslation(document, true);
    const menu = document.createElement('div');
    menu.textContent = 'Variable Assign and Declaration';
    document.body.appendChild(menu);
    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(menu.getAttribute('data-ui-translation')).toBe('变量赋值与声明');
    menu.textContent = 'A user authored sentence';
    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(menu.getAttribute('data-ui-translation')).toBeNull();
    translator.dispose();
  });
});

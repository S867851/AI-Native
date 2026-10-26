/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 * Deployment adaptation: an offline workflow requiring no model credentials.
 */
import { FlowDocumentJSON } from './typings';

export const initialData: FlowDocumentJSON = {
  globalVariable: { type: 'object', properties: {} },
  nodes: [
    {
      id: 'start_0',
      type: 'start',
      meta: { position: { x: 180, y: 240 } },
      data: {
        title: '开始',
        outputs: {
          type: 'object',
          properties: { message: { type: 'string', default: 'Hello FlowGram' } },
          required: ['message'],
        },
      },
    },
    {
      id: 'end_0',
      type: 'end',
      meta: { position: { x: 720, y: 240 } },
      data: {
        title: '结束',
        inputsValues: { message: { type: 'ref', content: ['start_0', 'message'] } },
        inputs: { type: 'object', properties: { message: { type: 'string' } } },
      },
    },
  ],
  edges: [{ sourceNodeID: 'start_0', targetNodeID: 'end_0' }],
};

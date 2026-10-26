/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

import { useState, useEffect, useCallback } from 'react';

import { useClientContext, FlowNodeEntity } from '@flowgram.ai/free-layout-editor';
import { Button, Badge, Toast } from '@douyinfe/semi-ui';

import { GetGlobalVariableSchema } from '../../plugins/variable-panel-plugin';
import { can, getRevision, platformFetch, setRevision, workflowId } from '../../jeecg-session';

export function Save(props: { disabled: boolean }) {
  const [errorCount, setErrorCount] = useState(0);
  const clientContext = useClientContext();

  const updateValidateData = useCallback(() => {
    const allForms = clientContext.document.getAllNodes().map((node) => node.form);
    const count = allForms.filter((form) => form?.state.invalid).length;
    setErrorCount(count);
  }, [clientContext]);

  /**
   * Validate all node and Save
   */
  const onSave = useCallback(async () => {
    const allForms = clientContext.document.getAllNodes().map((node) => node.form);
    await Promise.all(allForms.map(async (form) => form?.validate()));
    try {
      const response = await platformFetch(`/flowgram/workflows/${workflowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          revision: getRevision(),
          schema: {
            ...clientContext.document.toJSON(),
            globalVariable: clientContext.get<GetGlobalVariableSchema>(GetGlobalVariableSchema)(),
          },
        }),
      });
      if (!response.ok) throw new Error(`Save failed: ${response.status}`);
      setRevision((await response.json()).revision);
      Toast.success('已保存到服务器');
    } catch (error) {
      Toast.error(error instanceof Error ? error.message : '保存失败，请重试');
    }
  }, [clientContext]);

  /**
   * Listen single node validate
   */
  useEffect(() => {
    const listenSingleNodeValidate = (node: FlowNodeEntity) => {
      const { form } = node;
      if (form) {
        const formValidateDispose = form.onValidate(() => updateValidateData());
        node.onDispose(() => formValidateDispose.dispose());
      }
    };
    clientContext.document.getAllNodes().map((node) => listenSingleNodeValidate(node));
    const dispose = clientContext.document.onNodeCreate(({ node }) =>
      listenSingleNodeValidate(node)
    );
    return () => dispose.dispose();
  }, [clientContext]);

  if (!can('edit')) return null;
  if (errorCount === 0) {
    return (
      <Button
        disabled={props.disabled}
        onClick={onSave}
        style={{ backgroundColor: 'rgba(171,181,255,0.3)', borderRadius: '8px' }}
      >
        保存
      </Button>
    );
  }
  return (
    <Badge count={errorCount} position="rightTop" type="danger">
      <Button
        type="danger"
        disabled={props.disabled}
        onClick={onSave}
        style={{ backgroundColor: 'rgba(255, 179, 171, 0.3)', borderRadius: '8px' }}
      >
          保存
      </Button>
    </Badge>
  );
}

/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

import { useEffect, useState } from 'react';

import { DockedPanelLayer } from '@flowgram.ai/panel-manager-plugin';
import { EditorRenderer, FreeLayoutEditorProvider } from '@flowgram.ai/free-layout-editor';

import '@flowgram.ai/free-layout-editor/index.css';
import './styles/index.css';
import { FlowDocumentJSON } from './typings';
import { nodeRegistries } from './nodes';
import { initializeSession, platformFetch, setRevision, workflowId } from './jeecg-session';
import { useEditorProps } from './hooks';
import { initialData } from './deployment-initial-data';

export const Editor = () => {
  const [data, setData] = useState<FlowDocumentJSON | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    initializeSession()
      .then(() => platformFetch(`/flowgram/workflows/${workflowId}`))
      .then(async (response) => {
        if (!response.ok) throw new Error(`Load failed: ${response.status}`);
        return response.json();
      })
      .then((saved) => {
        setRevision(saved.revision);
        if (active) setData(saved.schema ?? initialData);
      })
      .catch((reason) => {
        if (active) setError(reason.message || '无法读取服务器流程，请刷新重试。');
      });
    return () => {
      active = false;
    };
  }, []);
  if (error) return <div style={{ padding: 32 }}>{error}</div>;
  if (!data) return <div style={{ padding: 32 }}>正在读取服务器草稿…</div>;
  return <LoadedEditor data={data} />;
};

const LoadedEditor = ({ data }: { data: FlowDocumentJSON }) => {
  const editorProps = useEditorProps(data, nodeRegistries);
  return (
    <div className="doc-free-feature-overview">
      <FreeLayoutEditorProvider {...editorProps}>
        <div className="demo-container">
          <DockedPanelLayer>
            <EditorRenderer className="demo-editor" />
          </DockedPanelLayer>
        </div>
      </FreeLayoutEditorProvider>
    </div>
  );
};

<template>
  <div class="flowgram-page">
    <div class="flowgram-toolbar">
      <strong>FlowGram 工作流</strong>
      <span>团队共享</span>
      <a-button @click="load">刷新列表</a-button>
      <a-button v-if="allowed('manage')" type="primary" @click="createWorkflow">新建流程</a-button>
      <a-button v-if="allowed('history')" @click="showHistory">运行记录</a-button>
      <a-button v-if="selected" @click="leaveEditor">返回列表</a-button>
      <a-button :type="translationEnabled ? 'primary' : 'default'" :aria-pressed="translationEnabled" @click="toggleTranslation">{{ translationEnabled ? '关闭翻译' : '开启翻译' }}</a-button>
    </div>
    <a-alert v-if="error" :message="error" type="error" show-icon />
    <template v-if="!selected">
      <a-table :data-source="rows" :columns="columns" row-key="id" :loading="loading" :pagination="{ pageSize: 10 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'state'">{{ record.archived ? '已归档' : '使用中' }}</template>
          <template v-if="column.key === 'actions'">
            <a-space>
              <a-button v-if="!record.archived" type="link" @click="openWorkflow(record)">打开画布</a-button>
              <a-button v-if="allowed('manage')" type="link" @click="renameWorkflow(record)">重命名</a-button>
              <a-button v-if="allowed('manage')" type="link" @click="archiveWorkflow(record)">{{ record.archived ? '恢复' : '归档' }}</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </template>
    <template v-else>
      <div class="flowgram-name">{{ selected.name }} <span>流程修改后请点击画布内的“保存”</span></div>
      <iframe ref="frame" :key="selected.id" :src="frameUrl" title="FlowGram 流程编排" @load="sendSession"></iframe>
    </template>
    <a-modal v-model:open="nameOpen" :title="naming?.id ? '重命名流程' : '新建流程'" :confirm-loading="saving" @ok="saveName">
      <a-input v-model:value="nameValue" placeholder="请输入流程名称" :maxlength="100" @pressEnter="saveName" />
    </a-modal>
    <a-modal v-model:open="historyOpen" title="运行记录" width="90%" :footer="null">
      <a-button @click="showHistory">刷新记录</a-button>
      <a-table :columns="historyColumns" :data-source="runs" row-key="id" :pagination="{ pageSize: 8 }" :scroll="{ x: 900 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">{{ statusText[record.status] || record.status }}</template>
          <template v-if="column.key === 'actions'"><a-button type="link" @click="showRun(record)">查看详情</a-button></template>
        </template>
      </a-table>
    </a-modal>
    <a-modal v-model:open="detailOpen" title="运行详情" width="80%" :footer="null"><pre>{{ runDetail }}</pre></a-modal>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
  import { message, Modal } from 'ant-design-vue';
  import { getToken, getTenantId } from '/@/utils/auth';

  interface Workflow { id: string; name: string; revision: number; archived: boolean; }
  const rows = ref<Workflow[]>([]);
  const selected = ref<Workflow | null>(null);
  const codes = ref<string[]>([]);
  const translationEnabled = ref(localStorage.getItem('flowgram-ui-translation') === 'true');
  const loading = ref(false);
  const error = ref('');
  const saving = ref(false);
  const frame = ref<HTMLIFrameElement>();
  const nameOpen = ref(false);
  const nameValue = ref('');
  const naming = ref<Workflow | null>(null);
  const historyOpen = ref(false);
  const detailOpen = ref(false);
  const runs = ref<any[]>([]);
  const runDetail = ref('');
  const allowed = (action: string) => codes.value.includes(`flowgram:${action}`);
  const frameUrl = computed(() => `/flowgram/?workflowId=${encodeURIComponent(selected.value?.id || '')}&uiVersion=20261026-37ca115`);
  const columns = [
    { title: '流程名称', dataIndex: 'name' }, { title: '版本', dataIndex: 'revision' },
    { title: '状态', key: 'state' }, { title: '更新人', dataIndex: 'updatedBy' },
    { title: '更新时间', dataIndex: 'updatedAt' }, { title: '操作', key: 'actions' },
  ];
  const historyColumns = [
    { title: '流程', dataIndex: 'workflowName' }, { title: '流程版本', dataIndex: 'workflowRevision' },
    { title: '执行人', dataIndex: 'username' }, { title: '状态', key: 'status' },
    { title: '开始时间', dataIndex: 'createdAt' }, { title: '操作', key: 'actions' },
  ];
  const statusText: Record<string, string> = { pending: '等待中', processing: '运行中', succeeded: '成功', failed: '失败', canceled: '已取消', interrupted: '已中断' };
  async function api(path: string, method = 'GET', body?: unknown) {
    const token = getToken();
    if (!token) throw new Error('登录已失效，请重新登录');
    const response = await fetch(`/flowgram${path}`, { method, cache: 'no-store',
      headers: { 'X-Access-Token': token, 'tenant-id': String(getTenantId() || ''), 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || '请求失败');
    return data;
  }
  async function load() {
    loading.value = true; error.value = '';
    try { codes.value = (await api('/session')).codes; rows.value = await api('/workflows'); }
    catch (reason) { error.value = (reason as Error).message; }
    finally { loading.value = false; }
  }
  function sendSession() {
    frame.value?.contentWindow?.postMessage({ type: 'flowgram:session', token: getToken(), tenant: String(getTenantId() || '') }, window.location.origin);
    sendTranslation();
  }
  function sendTranslation() {
    frame.value?.contentWindow?.postMessage({ type: 'flowgram:translation', enabled: translationEnabled.value }, window.location.origin);
  }
  function toggleTranslation() {
    translationEnabled.value = !translationEnabled.value;
    localStorage.setItem('flowgram-ui-translation', String(translationEnabled.value));
    sendTranslation();
  }
  function receive(event: MessageEvent) {
    if (event.origin === window.location.origin && event.source === frame.value?.contentWindow && event.data?.type === 'flowgram:ready') sendSession();
  }
  function openWorkflow(row: Workflow) { selected.value = row; }
  function leaveEditor() {
    Modal.confirm({ title: '返回流程列表？', content: '请先确认画布中的修改已经保存。', onOk: () => { selected.value = null; load(); } });
  }
  function createWorkflow() { naming.value = null; nameValue.value = ''; nameOpen.value = true; }
  function renameWorkflow(row: Workflow) { naming.value = row; nameValue.value = row.name; nameOpen.value = true; }
  const initialSchema = {
    globalVariable: { type: 'object', properties: {} },
    nodes: [
      { id: 'start_0', type: 'start', meta: { position: { x: 180, y: 240 } }, data: { title: '开始', outputs: { type: 'object', properties: { message: { type: 'string', default: 'Hello FlowGram' } }, required: ['message'] } } },
      { id: 'end_0', type: 'end', meta: { position: { x: 720, y: 240 } }, data: { title: '结束', inputsValues: { message: { type: 'ref', content: ['start_0', 'message'] } }, inputs: { type: 'object', properties: { message: { type: 'string' } } } } },
    ], edges: [{ sourceNodeID: 'start_0', targetNodeID: 'end_0' }],
  };
  async function saveName() {
    if (saving.value) return;
    if (!nameValue.value.trim()) { message.warning('请输入流程名称'); return; }
    saving.value = true;
    try {
      if (naming.value) await api(`/workflows/${naming.value.id}`, 'PUT', { name: nameValue.value, revision: naming.value.revision });
      else await api('/workflows', 'POST', { name: nameValue.value, schema: initialSchema });
      nameOpen.value = false; message.success('已保存'); await load();
    } catch (reason) { message.error((reason as Error).message); }
    finally { saving.value = false; }
  }
  function archiveWorkflow(row: Workflow) {
    Modal.confirm({ title: row.archived ? '恢复此流程？' : '归档此流程？', content: '归档后不能运行，管理员可以恢复。', onOk: async () => {
      try { await api(`/workflows/${row.id}`, 'PUT', { archived: !row.archived, revision: row.revision }); await load(); }
      catch (reason) { message.error((reason as Error).message); }
    } });
  }
  async function showHistory() {
    try { runs.value = await api('/runs'); historyOpen.value = true; }
    catch (reason) { message.error((reason as Error).message); }
  }
  async function showRun(row: any) {
    try { runDetail.value = JSON.stringify(await api(`/runs/${row.id}`), null, 2); detailOpen.value = true; }
    catch (reason) { message.error((reason as Error).message); }
  }
  onMounted(() => { window.addEventListener('message', receive); load(); });
  onBeforeUnmount(() => window.removeEventListener('message', receive));
</script>

<style scoped>
  .flowgram-page { padding: 16px; height: calc(100vh - 110px); display: flex; flex-direction: column; background: #fff; }
  .flowgram-toolbar { display: flex; align-items: center; gap: 12px; padding-bottom: 12px; }
  .flowgram-toolbar > span, .flowgram-name > span { color: #888; font-size: 12px; }
  .flowgram-name { padding: 8px 0; }
  iframe { width: 100%; flex: 1; min-height: 480px; border: 1px solid #eee; }
  pre { white-space: pre-wrap; overflow-wrap: anywhere; max-height: 65vh; overflow: auto; }
</style>

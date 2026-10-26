/**
 * Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 */

// Presentation annotations never replace React text, input values or workflow data.
const labels: Record<string, string> = {
  'Run the Script': '运行脚本',
  'Call the HTTP API': '调用HTTP接口',
  'Used to repeatedly execute a series of tasks by setting the number of iterations and logic.':
    '通过设置迭代次数和逻辑来重复执行一系列任务。',
  'The final node of the workflow, used to return the result information after the workflow is run.':
    '工作流的最终节点，用于返回执行后的结果信息。',
  'The starting node of the workflow, used to set the information needed to initiate the workflow.':
    '工作流的起始节点，用于设置启动流程所需的信息。',
  'Call the large language model and use variables and prompt words to generate responses.':
    '调用大语言模型，使用变量和提示词生成回复。',
  'Connect multiple downstream branches. Only the corresponding branch will be executed if the set conditions are met.':
    '连接多个下游分支，仅执行满足设定条件的对应分支。',
  'The final node of the block.': '流程块的结束节点。',
  'The starting node of the block.': '流程块的起始节点。',
  Download: '下载',
  Editable: '可编辑',
  FitView: '适应画布',
  True: '真',
  False: '假',
  Generate: '生成',
  'Configure via child fields': '通过子字段配置',
  'Default value if parameter is not provided': '未提供参数时使用的默认值',
  'Help LLM to understand the property': '帮助大模型理解该属性',
  'Input Key': '输入键名',
  'Input Variable Name': '输入变量名称',
  'JSON to JSONSchema': '从JSON生成JSON结构',
  'Paste JSON data': '粘贴JSON数据',
  'Please Input Array': '请输入数组',
  'Please Input Integer': '请输入整数',
  'Please Input Map': '请输入映射',
  'Please Input Object': '请输入对象',
  'Please Select Boolean': '请选择布尔值',
  PNG: 'PNG图片',
  JPEG: 'JPEG图片',
  SVG: '矢量图',
  JSON: 'JSON格式',
  YAML: 'YAML格式',
  'Add Node': '添加节点',
  'Test Run': '试运行',
  'Input Form': '输入表单',
  'JSON Mode': 'JSON模式',
  'Inputs Result': '输入结果',
  'Outputs Result': '输出结果',
  'Variable Assign and Declaration': '变量赋值与声明',
  Assign: '赋值',
  Declaration: '声明',
  'Select Variable': '选择变量',
  'Select variable': '选择变量',
  Empty: '空',
  Add: '添加',
  Remove: '移除',
  Delete: '删除',
  Cancel: '取消',
  Confirm: '确认',
  Save: '保存',
  Copy: '复制',
  Paste: '粘贴',
  Duplicate: '创建副本',
  'Edit Title': '编辑标题',
  'Move out': '移出',
  'Auto Layout': '自动布局',
  'Zoom in': '放大',
  'Zoom out': '缩小',
  'Fit View': '适应画布',
  'Fit view': '适应画布',
  Undo: '撤销',
  Redo: '重做',
  Problem: '问题',
  Problems: '问题',
  'No inputs found in start node': '开始节点中没有输入',
  'Running...': '运行中',
  Running: '运行中',
  Pending: '等待中',
  Succeed: '成功',
  Succeeded: '成功',
  Failed: '失败',
  Canceled: '已取消',
  Cancelled: '已取消',
  'Not executed': '未执行',
  'Not started': '未开始',
  Inputs: '输入',
  Outputs: '输出',
  Input: '输入',
  Output: '输出',
  'Input Parameters': '输入参数',
  'Output Parameters': '输出参数',
  'Global Variables': '全局变量',
  'Global Variable': '全局变量',
  'Add Variable': '添加变量',
  'Add Property': '添加属性',
  'Add Item': '添加条目',
  'Variable Name': '变量名称',
  'Variable Type': '变量类型',
  'Default Value': '默认值',
  'Please Input String': '请输入字符串',
  'Please Input Number': '请输入数字',
  'Please input': '请输入',
  'Please input integer': '请输入整数',
  'Please input number': '请输入数字',
  'Please input text': '请输入文本',
  'Please select': '请选择',
  Search: '搜索',
  'Search variable': '搜索变量',
  'Search Variable': '搜索变量',
  'Select Type': '选择类型',
  'Please Select Type': '请选择类型',
  Name: '名称',
  Type: '类型',
  Value: '值',
  Description: '说明',
  Required: '必填',
  String: '字符串',
  Number: '数字',
  Boolean: '布尔值',
  Object: '对象',
  Array: '数组',
  Properties: '属性',
  Settings: '设置',
  Options: '选项',
  Advanced: '高级',
  None: '无',
  'Raw Text': '纯文本',
  Headers: '请求头',
  Body: '请求体',
  Params: '参数',
  Query: '查询参数',
  Timeout: '超时',
  Method: '请求方法',
  if: '如果',
  else: '否则',
  'else if': '否则如果',
  Contains: '包含',
  'Not contains': '不包含',
  Equals: '等于',
  'Not equals': '不等于',
  'Is empty': '为空',
  'Is not empty': '不为空',
  'Greater than': '大于',
  'Less than': '小于',
  'Greater than or equal': '大于等于',
  'Less than or equal': '小于等于',
  'Starts with': '开头为',
  'Ends with': '结尾为',
  AND: '并且',
  OR: '或者',
  'Add Condition': '添加条件',
  'Add Branch': '添加分支',
  start: '开始',
  end: '结束',
  llm: '大模型',
  variable: '变量',
  condition: '条件分支',
  'multi-condition': '多条件分支',
  code: '代码',
  http: 'HTTP请求',
  loop: '循环',
  comment: '注释',
  group: '分组',
  break: '终止循环',
  continue: '继续循环',
  Start: '开始',
  End: '结束',
  LLM: '大模型',
  Variable: '变量',
  Condition: '条件分支',
  Code: '代码',
  Loop: '循环',
  Comment: '注释',
  Group: '分组',
  'Read Only': '只读',
  Readonly: '只读',
  'Mouse Friendly': '鼠标模式',
  'Touchpad Friendly': '触控板模式',
  'Download Workflow': '下载流程',
  'Download Image': '下载图片',
  Minimap: '缩略图',
  'Show Minimap': '显示缩略图',
  'Hide Minimap': '隐藏缩略图',
  'Add Comment': '添加注释',
};
const lowercaseLabels = new Map(
  Object.entries(labels).map(([key, value]) => [key.toLowerCase(), value])
);
const lookup = (value: string) => labels[value] || lowercaseLabels.get(value.toLowerCase());

const protectedContent =
  '[data-user-content],input,textarea,[contenteditable],pre,code,script,style,' +
  '.monaco-editor,.cm-editor,.gedit-m-variable-selector-var-name,' +
  '.gedit-m-variable-selector-root-title,.gedit-m-variable-selector-tag,' +
  '.gedit-m-display-outputs-wrapper,' +
  '[class*="variable-name"],[class*="variable-key"]';

export function installUITranslation(doc: Document, initiallyEnabled = false) {
  let enabled = initiallyEnabled;
  let frame = 0;
  const attributes = new Map<Element, Map<string, { original: string; rendered: string }>>();
  const style = doc.createElement('style');
  style.textContent =
    'html[data-flowgram-translation="on"] [data-ui-translation]::after {' +
    'content:"（" attr(data-ui-translation) "）";font-size:inherit;white-space:normal;}' +
    'html[data-flowgram-translation="on"] .semi-button{height:auto;min-height:24px;}' +
    'html[data-flowgram-translation="on"] [data-flowgram-system-label]{width:140px!important;min-width:140px!important;max-width:140px!important;}' +
    'html[data-flowgram-translation="on"] [data-flowgram-system-label] .semi-typography{overflow:visible!important;text-overflow:clip!important;}' +
    'html[data-flowgram-translation="on"] [data-flowgram-system-label] [data-ui-translation]::after{white-space:nowrap;}' +
    'html[data-flowgram-translation="on"] .flowgram-system-condition-display{display:flex!important;align-items:center;}' +
    'html[data-flowgram-translation="on"] .flowgram-system-condition-display input{width:0!important;flex:1;min-width:0;}' +
    'html[data-flowgram-translation="on"] .flowgram-system-condition-display::after{flex:0 0 auto;padding-right:6px;white-space:nowrap;}';
  doc.head.appendChild(style);
  const originalAttribute = (element: Element, name: string, current: string) => {
    const record = attributes.get(element)?.get(name);
    return record && record.rendered === current ? record.original : current;
  };
  function scan() {
    for (const element of Array.from(doc.body.querySelectorAll('*'))) {
      if (element.closest(protectedContent)) {
        element.removeAttribute('data-ui-translation');
        continue;
      }
      const direct = Array.from(element.childNodes)
        .filter((node) => node.nodeType === 3)
        .map((node) => node.textContent || '')
        .join('')
        .trim();
      const translated = lookup(direct) || lookup(direct.replace(/[:*：]\s*$/, '').trim());
      if (translated) {
        if (element.getAttribute('data-ui-translation') !== translated)
          element.setAttribute('data-ui-translation', translated);
      } else element.removeAttribute('data-ui-translation');
      // Placeholder and tooltip attributes are presentation only; never change value.
      for (const name of ['title', 'aria-label']) {
        const current = element.getAttribute(name);
        if (!current) continue;
        const original = originalAttribute(element, name, current);
        const chinese = lookup(original);
        if (!chinese) continue;
        const rendered = enabled ? `${original}（${chinese}）` : original;
        if (!attributes.has(element)) attributes.set(element, new Map());
        attributes.get(element)!.set(name, { original, rendered });
        if (current !== rendered) element.setAttribute(name, rendered);
      }
    }
    for (const element of Array.from(
      doc.body.querySelectorAll('input[placeholder],textarea[placeholder]')
    )) {
      if (element.closest('[data-user-content],.monaco-editor,.cm-editor,[contenteditable]'))
        continue;
      const current = element.getAttribute('placeholder')!;
      const original = originalAttribute(element, 'placeholder', current);
      const chinese = lookup(original);
      if (!chinese) continue;
      const rendered = enabled ? `${original}（${chinese}）` : original;
      if (!attributes.has(element)) attributes.set(element, new Map());
      attributes.get(element)!.set('placeholder', { original, rendered });
      if (current !== rendered) element.setAttribute('placeholder', rendered);
    }
    for (const element of Array.from(
      doc.body.querySelectorAll('.flowgram-system-condition-display')
    )) {
      const input = element.matches('input') ? element : element.querySelector('input');
      const value = (input as HTMLInputElement | null)?.value;
      if (value && lookup(value)) element.setAttribute('data-ui-translation', lookup(value)!);
    }
    for (const element of attributes.keys()) if (!element.isConnected) attributes.delete(element);
  }
  const schedule = () => {
    if (!frame)
      frame = doc.defaultView!.requestAnimationFrame(() => {
        frame = 0;
        scan();
      });
  };
  const observer = new MutationObserver(schedule);
  observer.observe(doc.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['placeholder', 'title', 'aria-label', 'data-user-content'],
  });
  function setEnabled(value: boolean) {
    enabled = value;
    doc.documentElement.dataset.flowgramTranslation = enabled ? 'on' : 'off';
    scan();
  }
  setEnabled(enabled);
  return {
    setEnabled,
    dispose: () => {
      observer.disconnect();
      if (frame) doc.defaultView!.cancelAnimationFrame(frame);
      setEnabled(false);
      style.remove();
      doc.body
        .querySelectorAll('[data-ui-translation]')
        .forEach((element) => element.removeAttribute('data-ui-translation'));
      delete doc.documentElement.dataset.flowgramTranslation;
    },
  };
}

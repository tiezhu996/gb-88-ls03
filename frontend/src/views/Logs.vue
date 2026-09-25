<template>
  <div>
    <div class="page-header">
      <h3>请求日志</h3>
      <a-space>
        <a-button @click="refreshLogs">
          <template #icon><icon-refresh /></template>
          刷新
        </a-button>
        <a-button status="danger" @click="handleClear">
          <template #icon><icon-delete /></template>
          清空日志
        </a-button>
      </a-space>
    </div>

    <a-card :loading="projectStore.loading">
      <a-timeline reverse>
        <a-timeline-item
          v-for="log in projectStore.logs"
          :key="log._id"
          :color="getLogColor(log.responseStatus)"
        >
          <div class="log-item">
            <div class="log-header">
              <a-tag :color="getMethodColor(log.method)" size="small">
                {{ log.method }}
              </a-tag>
              <code class="log-path">{{ log.path }}</code>
              <a-tag :color="getMatchColor(log)" size="small">
                {{ getMatchLabel(log) }}
              </a-tag>
              <a-tag :color="getStatusCodeColor(log.responseStatus)" size="small">
                {{ log.responseStatus }}
              </a-tag>
              <span class="log-time">{{ formatDate(log.createdAt) }}</span>
            </div>
            <div v-if="log.matched" class="log-match">
              <icon-check-circle class="match-icon match-hit" />
              命中接口：<strong>{{ formatApiLabel(log) }}</strong>
              <span class="match-priority">优先级 {{ log.priority ?? 0 }}</span>
              <template v-if="log.matchSource === 'condition'">
                ，命中规则：<a-tag color="arcoblue" size="small">{{ log.matchedRuleName || '未命名规则' }}</a-tag>
              </template>
              <template v-else>
                ，使用<span class="match-source">默认响应</span>
              </template>
            </div>
            <div v-else class="log-match log-miss">
              <icon-exclamation-circle class="match-icon" />
              未命中任何启用的接口（停用接口不参与匹配）
            </div>
            <a-collapse bordered>
              <a-collapse-panel header="请求详情">
                <a-row :gutter="16">
                  <a-col :span="12">
                    <div class="log-section">
                      <h4>命中来源</h4>
                      <pre class="log-json">{{ formatJson(getMatchDetail(log)) }}</pre>
                    </div>
                    <div class="log-section">
                      <h4>请求头</h4>
                      <pre class="log-json">{{ formatJson(log.headers) }}</pre>
                    </div>
                    <div class="log-section">
                      <h4>查询参数</h4>
                      <pre class="log-json">{{ formatJson(log.query) }}</pre>
                    </div>
                  </a-col>
                  <a-col :span="12">
                    <div class="log-section">
                      <h4>请求体</h4>
                      <pre class="log-json">{{ formatJson(log.body) }}</pre>
                    </div>
                    <div class="log-section">
                      <h4>响应体</h4>
                      <pre class="log-json">{{ formatJson(log.responseBody) }}</pre>
                    </div>
                  </a-col>
                </a-row>
              </a-collapse-panel>
            </a-collapse>
          </div>
        </a-timeline-item>
      </a-timeline>
      <a-empty v-if="!projectStore.loading && projectStore.logs.length === 0" description="暂无请求日志" />
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { Message, Modal } from '@arco-design/web-vue';
import { IconRefresh, IconDelete, IconCheckCircle, IconExclamationCircle } from '@arco-design/web-vue/es/icon';
import { useProjectStore } from '../store';
import type { RequestLog } from '../types';

const route = useRoute();
const projectStore = useProjectStore();

const projectId = computed(() => route.params.projectId as string);

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString('zh-CN');
}

function formatJson(data: any) {
  if (!data) return '{}';
  try {
    return JSON.stringify(typeof data === 'string' ? JSON.parse(data) : data, null, 2);
  } catch {
    return JSON.stringify(data, null, 2);
  }
}

function getMethodColor(method: string) {
  const colors: Record<string, string> = {
    GET: 'green',
    POST: 'blue',
    PUT: 'orange',
    DELETE: 'red',
    PATCH: 'purple'
  };
  return colors[method] || 'gray';
}

function getStatusCodeColor(status: number) {
  if (status >= 200 && status < 300) return 'green';
  if (status >= 300 && status < 400) return 'blue';
  if (status >= 400 && status < 500) return 'orange';
  return 'red';
}

function getLogColor(status: number) {
  if (status >= 200 && status < 300) return 'green';
  if (status >= 400) return 'red';
  return 'blue';
}

function isMatched(log: RequestLog) {
  // 兼容新字段上线前的旧日志
  return log.matchSource ? log.matchSource !== 'none' : !!log.apiId;
}

function getMatchLabel(log: RequestLog) {
  if (!isMatched(log)) return '未命中';
  if (log.matchSource === 'condition') return '条件命中';
  return '默认响应';
}

function getMatchColor(log: RequestLog) {
  if (!isMatched(log)) return 'red';
  if (log.matchSource === 'condition') return 'arcoblue';
  return 'green';
}

function formatApiLabel(log: RequestLog) {
  const method = log.apiMethod || log.method;
  const name = log.apiName ? `${log.apiName} · ` : '';
  const path = log.apiPath || log.path;
  return `${name}${method} ${path}`;
}

function getMatchDetail(log: RequestLog) {
  if (!isMatched(log)) {
    return {
      matched: false,
      reason: '没有启用的接口匹配该路径和方法（停用的接口不参与匹配）'
    };
  }
  return {
    matched: true,
    apiId: log.apiId,
    apiName: log.apiName || '',
    api: `${log.apiMethod || log.method} ${log.apiPath || log.path}`,
    priority: log.priority ?? 0,
    matchSource: log.matchSource === 'condition' ? 'condition（条件规则）' : 'default（默认响应）',
    matchedRuleId: log.matchedRuleId || '',
    matchedRuleName: log.matchedRuleName || ''
  };
}

function refreshLogs() {
  projectStore.fetchLogs(projectId.value);
}

function handleClear() {
  Modal.confirm({
    title: '确认清空',
    content: '确定要清空所有请求日志吗？此操作不可恢复。',
    onOk: async () => {
      try {
        const result = await projectStore.clearLogs(projectId.value);
        if (result.success) {
          Message.success('已清空');
        }
      } catch (error: any) {
        Message.error(error.response?.data?.error || '操作失败');
      }
    }
  });
}

onMounted(() => {
  projectStore.fetchLogs(projectId.value);
});
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h3 {
  margin: 0;
}

.log-item {
  width: 100%;
}

.log-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.log-path {
  flex: 1;
  font-size: 13px;
  color: #1d2129;
}

.log-time {
  font-size: 12px;
  color: #86909c;
}

.log-match {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 12px;
  font-size: 13px;
  color: #4e5969;
}

.log-miss {
  color: #cb2634;
}

.match-icon {
  font-size: 15px;
}

.match-hit {
  color: #00b42a;
}

.match-priority {
  margin-left: 4px;
  font-size: 12px;
  color: #86909c;
}

.match-source {
  color: #165dff;
}

.log-section {
  margin-bottom: 16px;
}

.log-section h4 {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #4e5969;
}

.log-json {
  margin: 0;
  padding: 12px;
  background: #f7f8fa;
  border-radius: 4px;
  font-size: 12px;
  max-height: 200px;
  overflow: auto;
}
</style>

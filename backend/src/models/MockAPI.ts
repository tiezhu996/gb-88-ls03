import mongoose, { Schema } from 'mongoose';
import { IMockAPI } from '../types';

const ConditionRuleSchema: Schema = new Schema({
  name: { type: String, default: '' },
  field: { type: String, required: true },
  operator: {
    type: String,
    enum: ['equals', 'contains', 'startsWith', 'endsWith'],
    required: true
  },
  value: { type: String, required: true },
  responseBody: { type: String, required: true },
  statusCode: { type: Number, required: true, default: 200 }
});

const MockAPISchema: Schema = new Schema({
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  name: {
    type: String,
    default: ''
  },
  path: {
    type: String,
    required: true
  },
  method: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    required: true
  },
  priority: {
    type: Number,
    default: 0
  },
  enabled: {
    type: Boolean,
    default: true
  },
  statusCode: {
    type: Number,
    default: 200
  },
  responseBody: {
    type: String,
    default: '{}'
  },
  responseHeaders: {
    type: Map,
    of: String,
    default: {}
  },
  delay: {
    type: Number,
    default: 0
  },
  conditions: {
    type: [ConditionRuleSchema],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 同一路径允许配置多份 Mock，按 priority 降序、createdAt 升序决定命中顺序
MockAPISchema.index({ projectId: 1, method: 1, enabled: 1, priority: -1, createdAt: 1 });

export default mongoose.model<IMockAPI>('MockAPI', MockAPISchema);

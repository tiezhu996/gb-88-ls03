import mongoose, { Schema } from 'mongoose';
import { IMockAPI } from '../types';

const ConditionRuleSchema: Schema = new Schema({
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
  path: {
    type: String,
    required: true
  },
  method: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    required: true
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
  priority: {
    type: Number,
    default: 0
  },
  enabled: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

MockAPISchema.index({ projectId: 1, method: 1, enabled: 1, priority: -1 });

export default mongoose.model<IMockAPI>('MockAPI', MockAPISchema);

import mongoose, { Schema } from 'mongoose';
import { IRequestLog } from '../types';

const RequestLogSchema: Schema = new Schema({
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  apiId: {
    type: Schema.Types.ObjectId,
    ref: 'MockAPI'
  },
  // 命中接口的快照信息，方便日志直接查看命中来源
  apiName: {
    type: String
  },
  apiPath: {
    type: String
  },
  apiMethod: {
    type: String
  },
  priority: {
    type: Number
  },
  // 是否有启用的接口命中（未命中也照常记录一条）
  matched: {
    type: Boolean,
    required: true,
    default: false
  },
  // default：接口默认响应；condition：条件规则响应；none：未命中
  matchSource: {
    type: String,
    enum: ['default', 'condition', 'none'],
    required: true,
    default: 'none'
  },
  matchedRuleId: {
    type: Schema.Types.ObjectId
  },
  matchedRuleName: {
    type: String
  },
  method: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  headers: {
    type: Map,
    of: String
  },
  body: {
    type: Schema.Types.Mixed
  },
  query: {
    type: Map,
    of: String
  },
  responseStatus: {
    type: Number,
    required: true
  },
  responseBody: {
    type: Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24 * 7
  }
});

RequestLogSchema.index({ projectId: 1, createdAt: -1 });

export default mongoose.model<IRequestLog>('RequestLog', RequestLogSchema);

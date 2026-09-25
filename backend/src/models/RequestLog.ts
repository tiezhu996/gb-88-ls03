import mongoose, { Schema } from 'mongoose';
import { IRequestLog } from '../types';

const MatchedConditionSchema: Schema = new Schema(
  {
    index: { type: Number, required: true },
    field: { type: String, required: true },
    operator: { type: String, required: true },
    value: { type: String, required: true }
  },
  { _id: false }
);

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
  matched: {
    type: Boolean,
    default: false
  },
  matchedApiPath: {
    type: String
  },
  matchedCondition: {
    type: MatchedConditionSchema,
    default: null
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

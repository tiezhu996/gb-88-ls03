import { Request, Response, NextFunction } from 'express';
import MockAPI from '../models/MockAPI';
import RequestLog from '../models/RequestLog';
import { parseFakerTemplate, checkCondition } from '../utils/fakerParser';

function matchPath(apiPath: string, requestPath: string): boolean {
  const apiParts = apiPath.split('/');
  const requestParts = requestPath.split('/');

  if (apiParts.length !== requestParts.length) {
    return false;
  }

  for (let i = 0; i < apiParts.length; i++) {
    if (apiParts[i].startsWith(':')) {
      continue;
    }
    if (apiParts[i] !== requestParts[i]) {
      return false;
    }
  }

  return true;
}

export async function mockEngine(req: Request, res: Response, next: NextFunction): Promise<void> {
  const fullPath = req.path;
  const mockMatch = fullPath.match(/^\/mock\/([^\/]+)(\/.*)$/);

  if (!mockMatch) {
    next();
    return;
  }

  const projectId = mockMatch[1];
  const requestPath = mockMatch[2];
  const method = req.method;

  try {
    // 仅启用中的接口参与匹配（enabled 缺省视为启用，兼容历史数据）；
    // 优先级数字大的先命中，相同优先级按创建时间先建先命中
    const apis = await MockAPI.find({ projectId, method, enabled: { $ne: false } }).sort({
      priority: -1,
      createdAt: 1
    });

    let matchedApi = null;
    for (const api of apis) {
      if (matchPath(api.path, requestPath)) {
        matchedApi = api;
        break;
      }
    }

    let responseBody: any = {};
    let statusCode = 404;
    let headers: Record<string, string> = {};
    let delay = 0;
    let matchedCondition = null;
    let matchedConditionIndex = -1;

    if (matchedApi) {
      statusCode = matchedApi.statusCode;
      const rawHeaders = matchedApi.responseHeaders;
      headers = rawHeaders instanceof Map
        ? Object.fromEntries(rawHeaders)
        : { ...(rawHeaders as Record<string, string> | undefined) };
      delay = matchedApi.delay || 0;

      for (let i = 0; i < matchedApi.conditions.length; i++) {
        const condition = matchedApi.conditions[i];
        if (checkCondition(condition, req.query as Record<string, string>, req.body, req.headers as Record<string, string>)) {
          matchedCondition = condition;
          matchedConditionIndex = i;
          break;
        }
      }

      if (matchedCondition) {
        responseBody = parseFakerTemplate(matchedCondition.responseBody);
        statusCode = matchedCondition.statusCode;
      } else {
        responseBody = matchedApi.responseBody ? parseFakerTemplate(matchedApi.responseBody) : {};
      }
    }

    setTimeout(async () => {
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      try {
        await RequestLog.create({
          projectId,
          apiId: matchedApi?._id,
          matched: !!matchedApi,
          matchedApiPath: matchedApi?.path,
          matchedCondition: matchedCondition
            ? {
                index: matchedConditionIndex,
                field: matchedCondition.field,
                operator: matchedCondition.operator,
                value: matchedCondition.value
              }
            : null,
          method,
          path: requestPath,
          headers: req.headers,
          body: req.body,
          query: req.query,
          responseStatus: statusCode,
          responseBody
        });
      } catch (logError) {
        console.error('Failed to log request:', logError);
      }

      if (statusCode === 204) {
        res.status(statusCode).send();
      } else if (typeof responseBody === 'string') {
        res.status(statusCode).send(responseBody);
      } else {
        res.status(statusCode).json(responseBody);
      }
    }, delay);

  } catch (error) {
    console.error('Mock engine error:', error);
    res.status(500).json({ error: 'Mock 服务内部错误' });
  }
}

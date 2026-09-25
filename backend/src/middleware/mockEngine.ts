import { Request, Response, NextFunction } from 'express';
import MockAPI from '../models/MockAPI';
import RequestLog from '../models/RequestLog';
import { parseFakerTemplate, checkCondition } from '../utils/fakerParser';
import { MatchSource, IConditionRule } from '../types';

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
    // 停用的接口不参与匹配；优先级大的先命中，相同优先级按创建时间早的先命中
    const apis = await MockAPI.find({ projectId, method, enabled: true })
      .sort({ priority: -1, createdAt: 1 });

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
    let matched = false;
    let matchSource: MatchSource = 'none';
    let matchedRuleId: string | undefined;
    let matchedRuleName: string | undefined;

    if (matchedApi) {
      matched = true;
      statusCode = matchedApi.statusCode;
      const rawHeaders = matchedApi.responseHeaders;
      headers = rawHeaders instanceof Map
        ? Object.fromEntries(rawHeaders)
        : { ...(rawHeaders as Record<string, string> | undefined) };
      delay = matchedApi.delay || 0;

      let matchedCondition: IConditionRule | null = null;
      let matchedConditionIndex = -1;
      for (let index = 0; index < matchedApi.conditions.length; index++) {
        const condition = matchedApi.conditions[index] as IConditionRule;
        if (
          checkCondition(condition, req.query as Record<string, string>, req.body, req.headers as Record<string, string>)
        ) {
          matchedCondition = condition;
          matchedConditionIndex = index;
          break;
        }
      }

      if (matchedCondition) {
        matchSource = 'condition';
        matchedRuleId = matchedCondition._id?.toString();
        matchedRuleName = matchedCondition.name || `规则 ${matchedConditionIndex + 1}`;
        responseBody = parseFakerTemplate(matchedCondition.responseBody);
        statusCode = matchedCondition.statusCode;
      } else {
        matchSource = 'default';
        responseBody = matchedApi.responseBody ? parseFakerTemplate(matchedApi.responseBody) : {};
      }

      const apiLabel = matchedApi.name
        ? `${matchedApi.name}(${matchedApi.method} ${matchedApi.path})`
        : `${matchedApi.method} ${matchedApi.path}`;
      if (matchSource === 'condition') {
        console.log(
          `[Mock] ${method} ${requestPath} 命中接口「${apiLabel}」优先级=${matchedApi.priority}，命中规则「${matchedRuleName}」`
        );
      } else {
        console.log(
          `[Mock] ${method} ${requestPath} 命中接口「${apiLabel}」优先级=${matchedApi.priority}，使用默认响应`
        );
      }
    } else {
      console.log(`[Mock] ${method} ${requestPath} 未命中任何启用的接口`);
    }

    setTimeout(async () => {
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      try {
        await RequestLog.create({
          projectId,
          apiId: matchedApi?._id,
          apiName: matchedApi?.name || '',
          apiPath: matchedApi?.path,
          apiMethod: matchedApi?.method,
          priority: matchedApi?.priority,
          matched,
          matchSource,
          matchedRuleId,
          matchedRuleName,
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

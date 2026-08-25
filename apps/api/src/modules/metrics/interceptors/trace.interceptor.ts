import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from '../metrics.service';

@Injectable()
export class TraceInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest();
    const res = http.getResponse();

    const traceId = (req.headers['x-trace-id'] as string) || `trc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const spanId = `spn-${Math.random().toString(36).substring(2, 7)}`;
    const startTime = Date.now();

    res.setHeader('x-trace-id', traceId);
    res.setHeader('x-span-id', spanId);

    const route = req.route?.path || req.url || 'unknown';
    const method = req.method;

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.metricsService.recordTraceSpan({
            traceId,
            spanId,
            name: `${method} ${route}`,
            serviceName: 'marketplace-api',
            durationMs: duration,
            status: 'OK',
            timestamp: new Date().toISOString(),
            attributes: {
              httpMethod: method,
              httpRoute: route,
              statusCode: res.statusCode || 200,
            },
          });
        },
        error: (err) => {
          const duration = Date.now() - startTime;
          this.metricsService.recordTraceSpan({
            traceId,
            spanId,
            name: `${method} ${route}`,
            serviceName: 'marketplace-api',
            durationMs: duration,
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            attributes: {
              httpMethod: method,
              httpRoute: route,
              error: err.message,
              statusCode: err.status || 500,
            },
          });
        },
      }),
    );
  }
}

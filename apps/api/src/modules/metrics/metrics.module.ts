import { Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { TraceInterceptor } from './interceptors/trace.interceptor';

@Module({
  controllers: [MetricsController],
  providers: [MetricsService, TraceInterceptor],
  exports: [MetricsService, TraceInterceptor],
})
export class MetricsModule {}

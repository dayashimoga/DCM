import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { PrismaModule } from './modules/prisma/prisma.module';
import { RedisModule } from './modules/redis/redis.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProviderModule } from './modules/provider/provider.module';
import { BenchmarkModule } from './modules/benchmark/benchmark.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { WorkloadModule } from './modules/workload/workload.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { BillingModule } from './modules/billing/billing.module';
import { PaymentModule } from './modules/payment/payment.module';
import { PayoutModule } from './modules/payout/payout.module';
import { SecurityModule } from './modules/security/security.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { ReputationModule } from './modules/reputation/reputation.module';
import { ApiKeyModule } from './modules/api-key/api-key.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    PrismaModule,
    RedisModule,
    HealthModule,
    AuthModule,
    ProviderModule,
    BenchmarkModule,
    MarketplaceModule,
    WorkloadModule,
    SchedulerModule,
    BillingModule,
    PaymentModule,
    PayoutModule,
    SecurityModule,
    MetricsModule,
    ReputationModule,
    ApiKeyModule,
  ],
})
export class AppModule {}

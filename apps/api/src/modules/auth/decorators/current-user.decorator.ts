import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserProfile } from '@distributed-compute/shared-types';

export const CurrentUser = createParamDecorator(
  (data: keyof UserProfile | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);

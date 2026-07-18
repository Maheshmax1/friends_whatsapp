import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Returns a specific property of user (like 'sub' for userId) or the whole user payload
    return data ? user?.[data] : user;
  },
);

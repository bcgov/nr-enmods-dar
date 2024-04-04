import { SetMetadata } from "@nestjs/common";

/*
    This decorator is used to determine whether an API needs to be authenticated
    If @Public is present, then the API will not require authentication
*/

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
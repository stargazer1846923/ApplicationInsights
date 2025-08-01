import { HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
export declare function httpTrigger(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit>;

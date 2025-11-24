import { httpRouter } from 'convex/server';
import { webhook } from './api/webhook';

const http = httpRouter();

http.route({
  path: '/webhook',
  method: 'POST',
  handler: webhook,
});

export default http;

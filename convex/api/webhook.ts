import { httpAction } from '../_generated/server';
import { internal } from '../_generated/api';

export const webhook = httpAction(async (ctx, request) => {
  const secret = process.env.ELEVENLABS_CONVAI_WEBHOOK_SECRET;

  const { event, error } = await constructWebhookEvent(request, secret);

  if (error) {
    console.log('error', error);

    return new Response(JSON.stringify({ error: error }), {
      status: 401,
    });
  }

  if (event.type === 'post_call_transcription') {
    // console.log('event data', JSON.stringify(event.data, null, 2));

    const conversation = event.data;
    const userId =
      conversation.conversation_initiation_client_data.dynamic_variables.userId;
    const lessonId =
      conversation.conversation_initiation_client_data.dynamic_variables
        .lessonId;
    const studentId =
      conversation.conversation_initiation_client_data.dynamic_variables
        .studentId;
    const agentId = conversation.agent_id;
    const conversationId = conversation.conversation_id;
    const status = conversation.status;
    const duration = conversation.metadata.call_duration_secs;
    const cost = conversation.metadata.cost;

    // const phrases =
    //   conversation.conversation_initiation_client_data.dynamic_variables
    //     .phrases;

    const progress =
      conversation.analysis.data_collection_results.progress.value;

    await ctx.runMutation(internal.conversations.add, {
      userId,
      lessonId,
      studentId,
      agentId,
      conversationId,
      status,
      duration,
      cost,
    });

    // if (progress) {
    //   await ctx.runMutation(internal.progress.add, {
    //     userId,
    //     lessonId,
    //     progress,
    //   });
    // }
  }

  return new Response(
    JSON.stringify({ message: 'post_call_transcription_webhook_success' }),
    {
      status: 200,
    }
  );
});

const constructWebhookEvent = async (req: Request, secret?: string) => {
  const body = await req.text();

  const signature_header = req.headers.get('ElevenLabs-Signature');
  console.log(signature_header);

  if (!signature_header) {
    return { event: null, error: 'Missing signature header' };
  }

  const headers = signature_header.split(',');
  const timestamp = headers.find((e) => e.startsWith('t='))?.substring(2);
  const signature = headers.find((e) => e.startsWith('v0='));

  if (!timestamp || !signature) {
    return { event: null, error: 'Invalid signature format' };
  }

  // Validate timestamp
  const reqTimestamp = Number(timestamp) * 1000;
  const tolerance = Date.now() - 30 * 60 * 1000;

  if (reqTimestamp < tolerance) {
    return { event: null, error: 'Request expired' };
  }

  // Validate hash using Web Crypto API
  const message = `${timestamp}.${body}`;

  if (!secret) {
    return { event: null, error: 'Webhook secret not configured' };
  }

  const digest = await createHmacSha256(secret, message);
  const expectedSignature = 'v0=' + digest;

  console.log({ digest: expectedSignature, signature });

  if (signature !== expectedSignature) {
    return { event: null, error: 'Invalid signature' };
  }

  const event = JSON.parse(body);

  return { event, error: null };
};

// Helper function to create HMAC SHA-256 using Web Crypto API
async function createHmacSha256(
  secret: string,
  message: string
): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);

  // Convert ArrayBuffer to hex string
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return hashHex;
}

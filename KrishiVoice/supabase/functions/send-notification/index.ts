import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// This is a robust mock for the notification engine.
// It can be easily connected to Twilio, Gupshup, or Vonage.

// @ts-ignore
Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    });
  }

  try {
    const { contactId, method, sellerPhone, message } = await req.json();

    console.log(`[Notification Engine] Processing inquiry ${contactId}`);
    console.log(`[Notification Engine] Method: ${method}`);
    console.log(`[Notification Engine] Destination: ${sellerPhone}`);
    console.log(`[Notification Engine] Content: ${message}`);

    // LOGIC: Here you would call your SMS/WhatsApp provider API
    // Example (Twilio):
    // const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${SID}/Messages.json`, ...);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notification queued successfully',
        provider: 'mock-engine-v1'
      }),
      {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        status: 200,
      }
    );
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        status: 400,
      }
    );
  }
});

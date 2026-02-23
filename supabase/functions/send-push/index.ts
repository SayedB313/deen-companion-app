import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Web Push helpers using raw crypto (no npm dependency needed in Deno)
function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function uint8ArrayToBase64Url(arr: Uint8Array): string {
  let binary = "";
  for (const byte of arr) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function createJwt(audience: string, subject: string, privateKeyRaw: Uint8Array): Promise<string> {
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = { aud: audience, exp: now + 86400, sub: subject };

  const enc = new TextEncoder();
  const headerB64 = uint8ArrayToBase64Url(enc.encode(JSON.stringify(header)));
  const payloadB64 = uint8ArrayToBase64Url(enc.encode(JSON.stringify(payload)));

  const key = await crypto.subtle.importKey(
    "pkcs8",
    derEncodeP256(privateKeyRaw),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const signingInput = enc.encode(`${headerB64}.${payloadB64}`);
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, signingInput));

  return `${headerB64}.${payloadB64}.${uint8ArrayToBase64Url(sig)}`;
}

function derEncodeP256(rawKey: Uint8Array): ArrayBuffer {
  // PKCS8 wrapper for a P-256 private key
  const prefix = new Uint8Array([
    0x30, 0x81, 0x87, 0x02, 0x01, 0x00, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86,
    0x48, 0xce, 0x3d, 0x02, 0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d,
    0x03, 0x01, 0x07, 0x04, 0x6d, 0x30, 0x6b, 0x02, 0x01, 0x01, 0x04, 0x20,
  ]);
  const suffix = new Uint8Array([0xa1, 0x44, 0x03, 0x42, 0x00]);
  const result = new Uint8Array(prefix.length + rawKey.length + suffix.length);
  result.set(prefix);
  result.set(rawKey, prefix.length);
  // We skip the public key part since we only need signing
  return result.buffer.slice(0, prefix.length + rawKey.length);
}

async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
) {
  const url = new URL(subscription.endpoint);
  const audience = `${url.protocol}//${url.host}`;

  const privateKeyRaw = base64UrlToUint8Array(vapidPrivateKey);
  const jwt = await createJwt(audience, vapidSubject, privateKeyRaw);

  // Generate local ECDH key pair for content encryption
  const localKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );
  const localPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", localKeyPair.publicKey)
  );

  // Import subscriber's public key
  const subscriberPublicKey = await crypto.subtle.importKey(
    "raw",
    base64UrlToUint8Array(subscription.p256dh),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // Derive shared secret
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: subscriberPublicKey },
      localKeyPair.privateKey,
      256
    )
  );

  const authSecret = base64UrlToUint8Array(subscription.auth);
  const enc = new TextEncoder();

  // HKDF-based key derivation (RFC 8291)
  const authInfo = enc.encode("Content-Encoding: auth\0");
  const prkKey = await crypto.subtle.importKey("raw", authSecret, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);

  // IKM = HKDF-Extract(auth_secret, shared_secret)
  const ikm = new Uint8Array(await crypto.subtle.sign("HMAC", prkKey, sharedSecret));

  // Build key info and nonce info  
  const subscriberPubRaw = base64UrlToUint8Array(subscription.p256dh);
  const keyInfo = new Uint8Array([
    ...enc.encode("Content-Encoding: aes128gcm\0"),
  ]);
  const nonceInfo = new Uint8Array([
    ...enc.encode("Content-Encoding: nonce\0"),
  ]);

  // Simple approach: use shared secret directly with AES-GCM
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // PRK from salt and IKM
  const saltKey = await crypto.subtle.importKey("raw", salt, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const prk = new Uint8Array(await crypto.subtle.sign("HMAC", saltKey, ikm));

  // Derive content encryption key
  const cekInfo = new Uint8Array([...enc.encode("Content-Encoding: aes128gcm\0"), 1]);
  const cekKey = await crypto.subtle.importKey("raw", prk.slice(0, 32), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const cekFull = new Uint8Array(await crypto.subtle.sign("HMAC", cekKey, cekInfo));
  const cek = cekFull.slice(0, 16);

  // Derive nonce
  const nonceInfoFull = new Uint8Array([...enc.encode("Content-Encoding: nonce\0"), 1]);
  const nonceKey = await crypto.subtle.importKey("raw", prk.slice(0, 32), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const nonceFull = new Uint8Array(await crypto.subtle.sign("HMAC", nonceKey, nonceInfoFull));
  const nonce = nonceFull.slice(0, 12);

  // Encrypt payload
  const payloadBytes = enc.encode(payload);
  const paddedPayload = new Uint8Array(payloadBytes.length + 1);
  paddedPayload.set(payloadBytes);
  paddedPayload[payloadBytes.length] = 2; // delimiter

  const aesKey = await crypto.subtle.importKey("raw", cek, { name: "AES-GCM" }, false, ["encrypt"]);
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, paddedPayload)
  );

  // Build aes128gcm header: salt(16) + rs(4) + idlen(1) + keyid(65) + encrypted
  const rs = new ArrayBuffer(4);
  new DataView(rs).setUint32(0, 4096);
  const header = new Uint8Array(16 + 4 + 1 + localPublicKeyRaw.length);
  header.set(salt, 0);
  header.set(new Uint8Array(rs), 16);
  header[20] = localPublicKeyRaw.length;
  header.set(localPublicKeyRaw, 21);

  const body = new Uint8Array(header.length + encrypted.length);
  body.set(header);
  body.set(encrypted, header.length);

  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aes128gcm",
      "TTL": "86400",
      Authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
    },
    body,
  });

  return response;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(JSON.stringify({ error: "VAPID keys not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authenticate caller
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawBody = await req.json();

    // Validate input
    const { z } = await import("https://deno.land/x/zod@v3.23.8/mod.ts");
    const inputSchema = z.object({
      title: z.string().min(1).max(200),
      body: z.string().min(1).max(1000),
    });
    const parsed = inputSchema.safeParse(rawBody);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid input", details: parsed.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { title, body: notifBody } = parsed.data;

    // Fetch user's push subscriptions using service role
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: subs } = await adminClient
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", user.id);

    if (!subs?.length) {
      return new Response(JSON.stringify({ sent: 0, message: "No subscriptions found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.stringify({ title, body: notifBody, icon: "/pwa-192x192.png" });
    let sent = 0;

    for (const sub of subs) {
      try {
        const res = await sendWebPush(
          sub,
          payload,
          vapidPublicKey,
          vapidPrivateKey,
          "mailto:noreply@deentracker.app"
        );
        if (res.ok || res.status === 201) {
          sent++;
        } else {
          console.error(`Push failed for endpoint: ${res.status} ${await res.text()}`);
          // Remove expired subscriptions
          if (res.status === 404 || res.status === 410) {
            await adminClient.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
          }
        }
      } catch (e) {
        console.error("Push send error:", e);
      }
    }

    return new Response(JSON.stringify({ sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-push error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

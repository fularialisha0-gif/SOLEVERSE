import 'dotenv/config';
import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const app = express();

app.use(express.json({ limit: '1mb' }));

interface WhatsAppItemInput {
  name: string;
  size: string;
  color: string;
  quantity: number;
  priceInr: number;
}

interface WhatsAppNotifyBody {
  orderId: string;
  customerName: string;
  customerPhone: string;
  paymentMethod: string;
  totalInr: number;
  ownerWhatsappNumber?: string;
  deliveryAddress: {
    line1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  items: WhatsAppItemInput[];
}

function getRazorpayConfig() {
  const keyId = (process.env.RAZORPAY_KEY_ID || '').trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
  return {
    configured: Boolean(keyId && keySecret),
    keyId: keyId || null,
    keySecret: keySecret || null,
  };
}

function getWhatsAppConfig() {
  const accessToken = (process.env.WHATSAPP_CLOUD_ACCESS_TOKEN || '').trim();
  const phoneNumberId = (process.env.WHATSAPP_PHONE_NUMBER_ID || '').trim();
  const ownerNumber = (process.env.WHATSAPP_OWNER_NUMBER || '').trim();
  return {
    configured: Boolean(accessToken && phoneNumberId && ownerNumber),
    accessToken,
    phoneNumberId,
    ownerNumber,
  };
}

function sanitizeDigits(phone: string): string {
  return phone.replace(/[^\d]/g, '').slice(0, 16);
}

function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

// Health & integration status (never exposes secrets)
app.get('/api/health', (_req, res) => {
  const rzp = getRazorpayConfig();
  const wa = getWhatsAppConfig();
  res.json({
    status: 'ok',
    integrations: {
      razorpayConfigured: rzp.configured,
      whatsappConfigured: wa.configured,
    },
  });
});

// Payment provider readiness check
app.get('/api/payments/config', (_req, res) => {
  const rzp = getRazorpayConfig();
  res.json({
    razorpayConfigured: rzp.configured,
    keyId: rzp.configured ? rzp.keyId : null,
    currency: 'INR',
    mode: rzp.configured ? 'live' : 'unconfigured',
  });
});

// Create Razorpay order (only when valid credentials are configured)
app.post('/api/payments/razorpay/order', async (req, res) => {
  const rzp = getRazorpayConfig();
  if (!rzp.configured || !rzp.keyId || !rzp.keySecret) {
    res.status(503).json({
      configured: false,
      error:
        'Razorpay payment gateway credentials are not configured on the server. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Secrets or complete checkout with Cash on Delivery.',
    });
    return;
  }

  const amountInr = Number(req.body?.amountInr);
  const receipt = typeof req.body?.receipt === 'string' ? req.body.receipt.slice(0, 40) : '';

  if (!Number.isFinite(amountInr) || amountInr <= 0 || amountInr > 10000000) {
    res.status(400).json({ error: 'Invalid INR amount for payment order.' });
    return;
  }

  try {
    const authHeader = Buffer.from(`${rzp.keyId}:${rzp.keySecret}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amountInr * 100),
        currency: 'INR',
        receipt: receipt || `sv_${Date.now()}`,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      res.status(502).json({ error: data?.error?.description || 'Failed to create Razorpay order.' });
      return;
    }

    res.json({
      configured: true,
      orderId: data.id,
      amount: data.amount,
      currency: data.currency,
      keyId: rzp.keyId,
    });
  } catch (err) {
    console.error('Razorpay order creation failed:', err);
    res.status(500).json({ error: 'Unable to communicate with Razorpay gateway.' });
  }
});

// Verify Razorpay payment signature
app.post('/api/payments/razorpay/verify', (req, res) => {
  const rzp = getRazorpayConfig();
  if (!rzp.configured || !rzp.keySecret) {
    res.status(503).json({ configured: false, verified: false, error: 'Razorpay is not configured.' });
    return;
  }

  const orderId = typeof req.body?.razorpayOrderId === 'string' ? req.body.razorpayOrderId : '';
  const paymentId = typeof req.body?.razorpayPaymentId === 'string' ? req.body.razorpayPaymentId : '';
  const signature = typeof req.body?.razorpaySignature === 'string' ? req.body.razorpaySignature : '';

  if (!orderId || !paymentId || !signature) {
    res.status(400).json({ verified: false, error: 'Missing payment verification fields.' });
    return;
  }

  const expected = crypto
    .createHmac('sha256', rzp.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const expectedBuf = Buffer.from(expected, 'utf8');
  const receivedBuf = Buffer.from(signature, 'utf8');
  const verified =
    expectedBuf.length === receivedBuf.length && crypto.timingSafeEqual(expectedBuf, receivedBuf);

  res.json({ verified });
});

// WhatsApp integration readiness
app.get('/api/whatsapp/status', (_req, res) => {
  const wa = getWhatsAppConfig();
  res.json({
    configured: wa.configured,
    ownerNumberConfigured: Boolean(wa.ownerNumber),
  });
});

// WhatsApp new order notification (Cloud API when configured + click-to-WhatsApp fallback)
app.post('/api/whatsapp/notify-order', async (req, res) => {
  const body = req.body as Partial<WhatsAppNotifyBody>;

  if (
    !body ||
    typeof body.orderId !== 'string' ||
    typeof body.customerName !== 'string' ||
    !Array.isArray(body.items) ||
    body.items.length === 0 ||
    typeof body.totalInr !== 'number'
  ) {
    res.status(400).json({ error: 'Invalid order payload for WhatsApp notification.' });
    return;
  }

  const addr = body.deliveryAddress;
  const addressLine = addr
    ? `${addr.line1 || ''}, ${addr.city || ''}, ${addr.state || ''} ${addr.postalCode || ''}, ${addr.country || 'India'}`
    : 'Not specified';

  const itemsSummary = body.items
    .slice(0, 20)
    .map(
      (item, idx) =>
        `${idx + 1}. ${String(item.name).slice(0, 80)} (${String(item.size)} / ${String(item.color)}) x${Number(item.quantity)} — ${formatInr(Number(item.priceInr) * Number(item.quantity))}`
    )
    .join('\n');

  const formattedMessage = [
    `NEW SOLEVERSE ORDER: #${body.orderId.slice(0, 40)}`,
    `Customer: ${body.customerName.slice(0, 80)}`,
    `Phone: ${String(body.customerPhone || 'N/A').slice(0, 24)}`,
    `Payment: ${String(body.paymentMethod || 'COD').slice(0, 20)}`,
    `Total Amount: ${formatInr(body.totalInr)}`,
    ``,
    `Ordered Footwear:`,
    itemsSummary,
    ``,
    `Delivery Address:`,
    addressLine,
  ].join('\n');

  const fallbackDigits = sanitizeDigits(body.ownerWhatsappNumber || '919820012345');
  const fallbackUrl = `https://wa.me/${fallbackDigits}?text=${encodeURIComponent(formattedMessage)}`;

  const wa = getWhatsAppConfig();
  if (!wa.configured) {
    res.json({
      sent: false,
      configured: false,
      message:
        'WhatsApp Business Cloud API is not configured. Use the Click-to-WhatsApp button below to dispatch this order alert directly.',
      fallbackUrl,
      formattedMessage,
    });
    return;
  }

  try {
    const graphUrl = `https://graph.facebook.com/v20.0/${encodeURIComponent(wa.phoneNumberId)}/messages`;
    const response = await fetch(graphUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${wa.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: sanitizeDigits(wa.ownerNumber),
        type: 'text',
        text: { body: formattedMessage },
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      res.status(502).json({
        sent: false,
        configured: true,
        error: result?.error?.message || 'WhatsApp Cloud API rejected the message.',
        fallbackUrl,
        formattedMessage,
      });
      return;
    }

    res.json({
      sent: true,
      configured: true,
      messageId: result?.messages?.[0]?.id || null,
      fallbackUrl,
      formattedMessage,
    });
  } catch (err) {
    console.error('WhatsApp Cloud API error:', err);
    res.status(502).json({
      sent: false,
      configured: true,
      error: 'Failed to reach WhatsApp Business Cloud API.',
      fallbackUrl,
      formattedMessage,
    });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distDir, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SOLEVERSE server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

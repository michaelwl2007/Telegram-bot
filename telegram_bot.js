const TelegramBot = require("node-telegram-bot-api");
const Stripe = require("stripe");
const express = require("express");
const app = express();

app.get("/success", (req, res) => {
  res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>body{font-family:sans-serif;background:#0a0a0a;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center}</style></head><body><div><h1 style="color:#22c55e">✓ Payment confirmed</h1><p>You'll receive access shortly.</p><p style="color:#555;font-size:13px">Close this tab and return to Telegram.</p></div></body></html>`);
});

app.get("/cancel", (req, res) => {
  res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>body{font-family:sans-serif;background:#0a0a0a;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center}</style></head><body><div><h1 style="color:#ef4444">✕ Payment cancelled</h1><p>No charge was made. Return to Telegram to try again.</p></div></body></html>`);
});

app.post("/webhook", express.raw({type: "application/json"}), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = Stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send("Webhook error");
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const product = session.line_items ? session.line_items.data[0]?.description : "Unknown item";
    const amount = (session.amount_total / 100).toFixed(2);
    const customer = session.customer_details?.email || "Unknown";
    bot.sendMessage(OWNER_ID, "💰 New payment received!\n\nItem: " + product + "\nAmount: $" + amount + " USD\nCustomer: " + customer);
  }
  res.json({received: true});
});

app.listen(8080, () => console.log("Web server running on port 8080"));

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const YOUR_DOMAIN = process.env.YOUR_DOMAIN;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const OWNER_ID = "6876719927";

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
const startTime = Math.floor(Date.now() / 1000);
const stripe = new Stripe(STRIPE_SECRET_KEY);

const PRODUCTS = [
  { name: "1TB", price: 100 },
  { name: "Folder 1", price: 50 },
  { name: "Folder 2", price: 20 },
  { name: "Folder 3", price: 20 },
  { name: "Folder 4", price: 20 },
  { name: "Folder 5", price: 20 },
  { name: "Folder 6", price: 50 },
  { name: "Folder 7", price: 30 },
  { name: "Folder 8", price: 20 },
  { name: "Folder 9", price: 20 },
  { name: "Folder 10", price: 20 },
  { name: "Folder 11", price: 30 },
  { name: "Folder 12", price: 20 },
  { name: "Folder 13", price: 20 },
  { name: "Folder 14", price: 30 },
];

// Build inline keyboard — 2 buttons per row
function buildMenu() {
  const buttons = PRODUCTS.map((p) => ({
    text: `${p.name} — $${p.price}`,
    callback_data: p.name,
  }));

  const rows = [];
  for (let i = 0; i < buttons.length; i += 2) {
    rows.push(buttons.slice(i, i + 2));
  }
  return { inline_keyboard: rows };
}

// /start command
bot.onText(/^\/start$/, (msg) => {
  if (msg.date < startTime) return;
  bot.sendMessage(
    msg.chat.id,
    "🚨MENU AVAILABLE 2026💦\n\n❓ANY QUESTIONS DM @allcontent360❓\n\n🚨ALL PRICES IN USD 💰\n\n💪SPECIAL💪\n1TB ALL FOLDERS $100 ✅\n\n1➡️ ALL TEENS COLLECTION 11-17 ✅ $50\n2➡️  NEW TEENS 11 - 17 ✅ $20\n3➡️  MIX TEENS 11-17 ✅ $20\n4➡️  WHITE TEENS 11-17 ✅ $20\n5➡️  BLACK TEENS 11-17 ✅ $20\n\n6➡️  ALL CP COLLECTION ✅ $50\n7➡️  NEW CP ✅ $30\n8➡️  MOM AND SON CP ✅ $20\n9➡️  FATHER AND DAUGHTER CP ✅ $20\n10➡️  GAY CP ✅ $20\n\n11➡️  ALL ONLINE COLLECTION ✅ $30\n12➡️  SNAPGOD FULL ✅ $20\n13➡️  ANXIOUS PANDA FULL ✅ $20\n\n14➡️  RAPE✅ $30\n\n🔥 PAY FOR FOLDER BELOW 👇",
    { reply_markup: buildMenu() }
  );
});

// Handle button presses
bot.on("callback_query", async (query) => {
  if (query.message.date < startTime) return;
  const chatId = query.message.chat.id;
  const selected = PRODUCTS.find((p) => p.name === query.data);

  if (!selected) {
    bot.answerCallbackQuery(query.id, { text: "Item not found." });
    return;
  }

  bot.answerCallbackQuery(query.id, { text: "Generating checkout link..." });

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: selected.name },
            unit_amount: selected.price * 100, // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${YOUR_DOMAIN}/success`,
      cancel_url: `${YOUR_DOMAIN}/cancel`,
    });

    bot.sendMessage(
      chatId,
      `✅ ${selected.name} — $${selected.price} USD\n\nClick below to pay securely:\n${session.url}`,
      {}
    );
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "❌ Something went wrong generating your payment link. Please try again.");
  }
});

console.log("Bot is running...");

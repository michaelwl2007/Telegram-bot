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

app.listen(8080, () => console.log("Web server running on port 8080"));

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const YOUR_DOMAIN = process.env.YOUR_DOMAIN;

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
    "What folder would you like to purchase? Choose below",
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
      `✅ *${selected.name}* — $${selected.price} USD\n\nClick below to pay securely:\n${session.url}`,
      { parse_mode: "Markdown" }
    );
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "❌ Something went wrong generating your payment link. Please try again.");
  }
});

console.log("Bot is running...");

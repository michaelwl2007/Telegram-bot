const TelegramBot = require("node-telegram-bot-api");
const Stripe = require("stripe");

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const YOUR_DOMAIN = process.env.YOUR_DOMAIN;

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
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
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "🚨MENU AVAILABLE 2026💦
🚨ALL PRICES IN USD 💰

💪SPECIAL💪
1TB ALL FOLDERS $100 ✅

1➡️ ALL TEENS COLLECTION 11-17 ✅ $50
2➡️  NEW TEENS 11 - 17 ✅ $20
3➡️  MIX TEENS 11-17 ✅ $20
4➡️  WHITE TEENS 11-17 ✅ $20
5➡️  BLACK TEENS 11-17 ✅ $20

6➡️  ALL CP COLLECTION ✅ $50
7➡️  NEW CP ✅ $30
8➡️  MOM AND SON CP ✅ $20
9➡️  FATHER AND DAUGHTER CP ✅ $20
10➡️  GAY CP ✅ $20

11➡️  ALL ONLINE COLLECTION ✅ $30
12➡️  SNAPGOD FULL ✅ $20
13➡️  ANXIOUS PANDA FULL ✅ $20

14➡️  RAPE✅ $30

🔥AND MORE FOLDERS... ",
    { reply_markup: buildMenu() }
  );
});

// Handle button presses
bot.on("callback_query", async (query) => {
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

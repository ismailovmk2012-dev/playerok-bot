const { Telegraf, Markup } = require('telegraf');
const http = require('http');

// Бот берет токен строго из панели настроек Render
const bot = new Telegraf(process.env.BOT_TOKEN);

const WELCOME_TEXT = `Добро пожаловать 👋\n\n✅ *PlayerOk* — специализированный маркетплейс и торговый гарант.\n\n• Комиссия сервиса: 1%\n• Режим работы системы: 24/7\n• Главный модератор: @sw1zyy01\n\n🛡️ Выберите нужный раздел ниже:`;

const KEYBOARD = Markup.inlineKeyboard([
  [Markup.button.callback('💳 Баланс', 'menu_balance'), Markup.button.callback('🤝 Создать сделку', 'menu_create')],
  [Markup.button.callback('🛡️ Безопасность', 'menu_safety'), Markup.button.callback('👨‍💻 Поддержка', 'menu_support')]
]);

bot.start((ctx) => ctx.replyWithMarkdown(WELCOME_TEXT, KEYBOARD));

bot.action('menu_balance', (ctx) => {
  const text = `💳 *Личный кабинет*\n\n💰 *Баланс:* 69 999 999.00 руб.\n🔒 *Заморожено:* 0.00 руб.\n\n✨ Аккаунт полностью верифицирован.`;
  return ctx.editMessageText(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Меню', 'to_main')]) ] }).catch(() => {});
});

bot.action('menu_support', (ctx) => {
  const text = `👨‍💻 *Служба поддержки PlayerOk*\n\n✍️ *Связь с модератором:* @sw1zyy01`;
  return ctx.editMessageText(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Меню', 'to_main')]) ] }).catch(() => {});
});

bot.action('menu_safety', (ctx) => {
  const text = `🛡️ *Правила безопасности PlayerOk*\n\n1. Проводите оплату внутри бота.\n2. Не подтверждайте сделку до проверки товара.`;
  return ctx.editMessageText(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Меню', 'to_main')]) ] }).catch(() => {});
});

bot.action('menu_create', (ctx) => {
  return ctx.editMessageText(`🤝 *Создание сделки*\n\nКнопки переключения этапов появятся после обновления интерфейса.`, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Меню', 'to_main')]) ] }).catch(() => {});
});

bot.action('to_main', (ctx) => ctx.editMessageText(WELCOME_TEXT, { parse_mode: 'Markdown', ...KEYBOARD }).catch(() => {}););

bot.launch().then(() => console.log('Бот успешно запущен!'));

http.createServer((req, res) => { res.writeHead(200); res.end('OK'); }).listen(process.env.PORT || 3000);

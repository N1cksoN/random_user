//TODO: исправить баг с проверкой на зарегестрированых 

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const helpers = require('./helpers');
const user = require('./models/user');


helpers.logStart();

const User = mongoose.model('user');

//bot start
const bot = new TelegramBot(process.env.BOT_TOKEN, {
	polling: {
		interval: 300,
		autoStart: true,
		params: {
			timeout: 10
		}
	}
});

//MONGO
mongoose.connect(process.env.DATAB_URL, {
	//useMongoClient: true
	useNewUrlParser: true,
	useUnifiedTopology: true,
	useFindAndModify: false,
	useCreateIndex: true,

})
	.then(() => console.log('MongoDB connected'))
	.catch((err) => console.log(err))


bot.onText(/\/start/, async msg => {
	const chatId = msg.chat.id;
	bot.sendMessage(chatId, `Здравствуй, этот бот был создан для рофла от CIS_CS\nТак же тут можно определить самого главного пидора в вашем групповом чате.\nДля детальной информации введите \/help\nПриятной игры!`);
});



bot.onText(/\/sticker/, async msg => {
	const chatId = msg.chat.id;
	bot.sendMessage(chatId, `Скачать лучший стикерпак телеграмма можно по ссылке внизу:\nhttps://t.me/addstickers/Batrusiki`);
});


bot.onText(/\/help/, async msg => {
	const chatId = msg.chat.id;
	bot.sendMessage(chatId, `Здесь можно узнать, для чего каждая команда нужна:\n\n${ 1 }. Для приветствия бота введите:\n \/start\n
${ 2 }. Для скачивания лучшего стикерпака введите:\n \/sticker\n
${ 3 }. Для регистрации в игре введите:\n \/reg_pidor\n
${ 4 }. Для поиска пидора введите:\n \/pidor\n
${ 5 }. Для просмотра статистики пидоров в этом чате введите:\n \/stat_pidor\n`);
});



bot.onText(/\/reg_pidor/, async msg => {
  const user = await findOneUser(msg).then(user => user)
  if (user) {
      bot.sendMessage(msg.chat.id, `Эй! Ты уже есть в базе!`)
  } else {
      registration(msg).then(user => {
      bot.sendMessage(msg.chat.id, `${getName(user, true)}, готово! Ты зарегистрирован!`);

    });
  }
});

bot.onText(/\/pidor/, async msg => {
	const chatId = msg.chat.id;
	const todayPidor = await checkTodaySavedUser(msg);
  if (todayPidor) {
    bot.sendMessage(msg.chat.id, `Сегодня уже был выбран пидор дня - ${getName(todayPidor, true)}`);
  } // ТУТ ДОЛЖНА БЫТЬ ПРОВЕРКА НА НАЛИЧИЕ ЮЗЕРОВ 
	else {
    const pidor = await findRandomUser(msg);
    saveRandomUser(pidor);
    bot.sendMessage(msg.chat.id, `${getName(pidor, true)}, поздравляю, ты пидор!`);
    //bot.sendMessage(chatId, text);
  }  
});

bot.onText(/\/stat_pidor/, async msg => {
	const chatId = msg.chat.id;
	bot.sendMessage(chatId, await getStats(msg));
	//bot.sendMessage(chatId, await showAllUsers(msg));  какой то баг сдесь
});

function registration(message) {
  const user = new User({
	  id: message.from.id,
	  //username: message.from.username || '',
	  firstName: message.from.first_name,
	  //lastName: message.from.last_name,
	  chatId: message.chat.id,
	  pidorCount: 0,

		pidorDate: '15/07/2020',
  })
	return user
	.save()
	.then(result => result)
}


async function findOneUser(message) {
  return await User.findOne({ 'id': message.from.id, 'chatId': message.chat.id }, (err, user) => {
  if (err) return false
  return user
  });
}

async function findAllUsers(message) {
  return await User.find({'chatId': message.chat.id}, (err, users) => {
  if (err) return false
    return users
  });
}


async function checkTodaySavedUser(message) {
  return await User.findOne({ 'chatId': message.chat.id, 'pidorDate': getDate() }, (err, users) => {
  if (err) return false
    return users
  });
 }

async function findRandomUser(message) {
  const users = await findAllUsers(message)
  const index = Math.floor(Math.random() * Math.floor(users.length))
  return users[index]
}

async function saveRandomUser(user) {
  const set = { pidorDate: getDate(), pidorCount: ++user.pidorCount }
  return await User.findOneAndUpdate({ 'id': user.id, 'chatId': user.chatId}, { $set:set }, { new: true }, (err, user) => {
    if (err) return false
      return user
  });
}

async function showAllUsers(message) {
	const chatId = message.chat.id;
  const users = await findAllUsers(message);
  const index = `${ users.length }`; 
  bot.sendMessage(chatId, `Всего участников - ${ index }`)
  return users[index]
}

function getName(user, hasMention) {
	// if(user.firstName) {
	// 	return `${ user.firstName }`
	// } else if(user.username)
 //  return `${hasMention ? '@' : ''}${user.username}`
 return `${ user.firstName }`//user.username ? `${hasMention ? '@' : ''}${user.username}` : `${ user.firstName }`
}

function getDate() {
  const date = new Date();
  const d = date.getDate();
  const m = date.getMonth() + 1;
  const y = date.getFullYear();
  return `${(m <= 9 ? '0' + m : m)}/${(d <= 9 ? '0' + d : d)}/${y}`
}

async function getStats(message) {
	const chatId = message.chat.id;
  const users = await findAllUsers(message);
  //const placesNumber = [];
  let formattedUsers = 'Топ пидоров:\n\n';
    
  users.sort((a, b) => +new Date(a.pidorDate) < +new Date(b.pidorDate));
  users.sort((a, b) => {
  	 return b.pidorCount - a.pidorCount;
  });
    
  users.forEach((user, index) => {
    const pidorName = `${ user.firstName }`;
    const place = index + 1 + '.';
    formattedUsers += `${ place } ${ pidorName } - ${ user.pidorCount } раз(а)\n`;
  });
  return formattedUsers;
 
}

bot.on("polling_error", (err) => console.log(err));

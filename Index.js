const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const token = process.env.TELEGRAM_BOT_TOKEN;
const app = express();
const port = process.env.PORT || 10000;

if (!token) {
  throw new Error("Falta TELEGRAM_BOT_TOKEN");
}

const bot = new TelegramBot(token, { polling: true });

const menu = `Bienvenido a Coach Softbol Beisbol.\n\nTe ayudo con dudas de beisbol, softbol fast pitch y slow pitch para jugadores, coaches, ampayers, anotadores y ligas.\n\nPara resolver bien tu duda, dime:\n\n1. Modalidad: beisbol, fast pitch o slow pitch\n2. Tu rol: ampayer, coach, jugador, anotador u organizador\n3. Tipo de duda: regla, mecanica, lineup, protesta, anotacion o jugada\n4. Si es jugada: outs, corredores, conteo y que paso`; 

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, menu);
});

bot.on("message", (msg) => {
  if (!msg.text || msg.text.startsWith("/start")) return;

  const respuesta = `Para ayudarte bien, necesito ordenar la informacion:\n\n1. ¿Es beisbol, softbol fast pitch o slow pitch?\n2. ¿Preguntas como ampayer, coach, jugador, anotador u organizador?\n3. ¿Cuantos outs habia?\n4. ¿Que corredores estaban en base?\n5. ¿Que paso exactamente en la jugada?\n6. ¿Tu liga usa reglamento WBSC, USA Softball, MLB o regla local?\n\nCon esos datos te doy:\n- resumen de la jugada\n- criterio aplicable\n- decision probable\n- mecanica sugerida para el ampayer\n- como explicarlo a coaches o managers`;

  bot.sendMessage(msg.chat.id, respuesta);
});

app.get("/", (req, res) => {
  res.send("Coach Softbol Beisbol bot activo");
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Servidor activo en puerto ${port}`);
});

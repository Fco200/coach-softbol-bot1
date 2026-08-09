const express = require("express");
const { Telegraf } = require("telegraf");

const token = process.env.TELEGRAM_BOT_TOKEN;
const app = express();
const port = process.env.PORT || 10000;

if (!token) {
  throw new Error("Falta TELEGRAM_BOT_TOKEN");
}

const bot = new Telegraf(token);

const menu = `Bienvenido a Coach Softbol Beisbol.

Te ayudo con dudas de beisbol, softbol fast pitch y slow pitch para jugadores, coaches, ampayers, anotadores y ligas.

Para resolver bien tu duda, dime:

1. Modalidad: beisbol, fast pitch o slow pitch
2. Tu rol: ampayer, coach, jugador, anotador u organizador
3. Tipo de duda: regla, mecanica, lineup, protesta, anotacion o jugada
4. Si es jugada: outs, corredores, conteo y que paso`;

bot.start((ctx) => {
  ctx.reply(menu);
});

bot.on("text", (ctx) => {
  const text = ctx.message.text;
  if (text === "/start") return;

  const respuesta = `Para ayudarte bien, necesito ordenar la informacion:

1. ¿Es beisbol, softbol fast pitch o slow pitch?
2. ¿Preguntas como ampayer, coach, jugador, anotador u organizador?
3. ¿Cuantos outs habia?
4. ¿Que corredores estaban en base?
5. ¿Que paso exactamente en la jugada?
6. ¿Tu liga usa reglamento WBSC, USA Softball, MLB o regla local?

Con esos datos te doy:
- resumen de la jugada
- criterio aplicable
- decision probable
- mecanica sugerida para el ampayer
- como explicarlo a coaches o managers`;

  ctx.reply(respuesta);
});

bot.launch();

app.get("/", (req, res) => {
  res.send("Coach Softbol Beisbol bot activo");
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Servidor activo en puerto ${port}`);
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

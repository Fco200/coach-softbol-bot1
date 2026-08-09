const express = require("express");
const { Telegraf } = require("telegraf");
const OpenAI = require("openai");

const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const openaiKey = process.env.OPENAI_API_KEY;
const app = express();
const port = process.env.PORT || 10000;

if (!telegramToken) throw new Error("Falta TELEGRAM_BOT_TOKEN");
if (!openaiKey) throw new Error("Falta OPENAI_API_KEY");

const bot = new Telegraf(telegramToken);
const openai = new OpenAI({ apiKey: openaiKey });

const systemPrompt = `Eres un asistente experto en beisbol, softbol fast pitch y slow pitch para jugadores, coaches, ampayers, anotadores y organizadores de ligas.

Responde siempre en español claro de Mexico.

Tu objetivo es ayudar a resolver dudas de reglas, jugadas, mecanica de ampayeo, lineups, sustituciones, anotacion, protestas, estrategia y reglamentos locales.

Cuando analices una jugada, usa este formato:

1. Resumen de la jugada
2. Datos que faltan, solo si son necesarios
3. Criterio aplicable
4. Decision probable
5. Mecanica sugerida para el ampayer
6. Como explicarlo a coaches o managers
7. Advertencias por regla local o modalidad

Reglas importantes:
- No inventes numeros de regla.
- Si no sabes el articulo exacto, di "segun el criterio general".
- Distingue entre beisbol, softbol fast pitch y slow pitch cuando pueda cambiar la decision.
- Si faltan datos importantes, pregunta solo lo necesario.
- No digas que algo es oficial si no se identifico el reglamento.
- Para protestas oficiales, recomienda revisar el reglamento vigente y consultar al ampayer en jefe o comite de reglas.
- Se practico, neutral y didactico.`;

const startMessage = `Bienvenido a Coach Softbol Beisbol.

Te ayudo con dudas de beisbol, softbol fast pitch y slow pitch para jugadores, coaches, ampayers, anotadores y ligas.

Puedes escribirme una jugada completa, por ejemplo:

Slow pitch, 1 out, corredor en tercera. El bateador conecta elevado de foul y lo atrapa el catcher. El corredor pisa y sale a home. ¿Cuenta la carrera?

Si faltan datos importantes, te preguntare solo lo necesario.`;

bot.start((ctx) => ctx.reply(startMessage));

bot.on("text", async (ctx) => {
  const userText = ctx.message.text;
  if (userText === "/start") return;

  try {
    await ctx.reply("Estoy revisando la jugada...");

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userText }
      ]
    });

    const answer = response.output_text || "No pude generar respuesta. Intenta escribir la jugada con mas datos.";
    await ctx.reply(answer)} catch (error) {
  console.error("OPENAI ERROR STATUS:", error.status);
  console.error("OPENAI ERROR MESSAGE:", error.message);
  console.error("OPENAI ERROR CODE:", error.code);
  console.error("OPENAI ERROR TYPE:", error.type);

  await ctx.reply("Tuve un error al consultar la IA. Revisa los logs de Render para ver si es key, saldo, modelo o limite de uso.");
}
  
    Render.");
  }
});

bot.launch();

app.get("/", (req, res) => {
  res.send("Coach Softbol Beisbol bot con IA activo");
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Servidor activo en puerto ${port}`);
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

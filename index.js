const express = require("express");
const { Telegraf, Markup } = require("telegraf");

const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const app = express();
const port = process.env.PORT || 10000;

if (!telegramToken) throw new Error("Falta TELEGRAM_BOT_TOKEN");

const bot = new Telegraf(telegramToken);

const mainMenu = Markup.keyboard([
  ["Slow Pitch", "Fast Pitch"],
  ["Beisbol"],
  ["Jugada", "Regla"],
  ["Mecanica", "Lineup"],
  ["Protesta", "Ayuda"]
]).resize();

const startMessage = `Bienvenido a Coach Softbol Beisbol.

Te ayudo con dudas de beisbol, softbol fast pitch y slow pitch para jugadores, coaches, ampayers, anotadores y ligas.

Por ahora funciono con plantillas, sin IA.

Puedes tocar una opcion del menu o escribir una duda como:

Slow pitch, 1 out, corredor en tercera, elevado de foul atrapado por catcher. El corredor pisa y sale a home. Cuenta la carrera?`;

const templates = {
  slowpitch: `SLOW PITCH

Puedo ayudarte con:

- Foul con 2 strikes
- Elevado de foul atrapado
- Bola viva / bola muerta
- Corredores que salen antes
- Home run limit
- Lineup y sustituciones
- Apelaciones
- Interferencia y obstruccion

Para revisar una jugada, mandame:

1. Outs
2. Corredores en base
3. Conteo
4. Que paso con la bola
5. Que marco el ampayer
6. Si hay regla local`,

  fastpitch: `FAST PITCH

Puedo ayudarte con:

- Salida anticipada de corredoras
- Lanzamiento ilegal
- Robo de base
- Toque de bola
- Bola viva / bola muerta
- Interferencia y obstruccion
- Lineup, DP/Flex y sustituciones

Para revisar una jugada, mandame modalidad, outs, corredoras, conteo y que paso exactamente.`,

  beisbol: `BEISBOL

Puedo ayudarte con:

- Balk
- Infield fly
- Interferencia
- Obstruccion
- Apelaciones
- Bateador fuera de turno
- Lineup y sustituciones
- Bola viva / bola muerta

Para revisar una jugada, mandame inning, outs, corredores, conteo, accion de la bola y decision marcada.`,

  jugada: `FORMATO PARA ANALIZAR JUGADA

Mandame la informacion asi:

1. Modalidad: beisbol, fast pitch o slow pitch
2. Rol: ampayer, coach, jugador, anotador u organizador
3. Outs
4. Corredores en base
5. Conteo del bateador
6. Que paso exactamente
7. Que marco el ampayer
8. Que reclama cada equipo
9. Si hay regla local

Con eso te respondere en este formato:

- Decision probable
- Criterio aplicable
- Explicacion corta
- Reanudacion del juego
- Advertencia por regla local`,

  regla: `DUDA DE REGLA

Escribeme:

1. Modalidad
2. Tema de la regla
3. Situacion concreta
4. Si es reglamento local, torneo o liga

Importante: sin reglamento oficial a la vista, respondere con criterio general y no inventare numeros de regla.`,

  mecanica: `MECANICA PARA AMPAYER

Puedo ayudarte con:

- Posicion inicial
- Coberturas
- Rotaciones
- Señales
- Comunicacion entre ampayers
- Prioridades en bola bateada
- Apelaciones
- Jugadas en home

Mandame:

1. Numero de ampayers
2. Modalidad
3. Corredores en base
4. Tipo de batazo o jugada`,

  lineup: `LINEUP Y SUSTITUCIONES

Puedo ayudarte con:

- Orden al bat
- Reingreso
- Sustituciones
- Jugador ilegal
- Bateador fuera de turno
- DP/Flex en fast pitch
- EP/EH si tu liga lo usa

Mandame modalidad, regla de liga si existe y que cambio hizo el manager.`,

  protesta: `APELACION O PROTESTA

Para revisar si procede una protesta, mandame:

1. Modalidad
2. Entrada y outs
3. Jugada exacta
4. Decision del ampayer
5. Momento en que el manager protesto
6. Regla que creen que se aplico mal

Criterio general: una protesta normalmente procede por mala aplicacion de regla, no por juicio del ampayer como safe/out, bola/strike o fair/foul de apreciacion.`
};

function analyzeText(text) {
  const t = text.toLowerCase();

  if (t.includes("foul") && t.includes("catcher") && (t.includes("tercera") || t.includes("3")) && t.includes("home")) {
    return `DECISION PROBABLE
La carrera puede contar si el corredor retoco tercera correctamente despues de la atrapada y anoto antes de un tercer out valido.

DISCIPLINA
Aplica como criterio general en beisbol, fast pitch y slow pitch, salvo regla local especial.

CRITERIO APLICABLE
Un elevado de foul atrapado legalmente produce out al bateador, pero la bola normalmente sigue viva. Los corredores pueden avanzar despues de retocar su base.

EXPLICACION
Si el catcher atrapa legalmente el foul fly, el bateador es out. El corredor de tercera puede pisar/retocar tercera y salir hacia home. Si la defensa no lo pone out y no gana una apelacion por salida anticipada, la carrera cuenta.

REANUDACION
Se registra el out al bateador. Si la carrera anoto legalmente, cuenta y el juego sigue con la nueva situacion de outs.

ADVERTENCIA
Si esa atrapada fue el tercer out sobre el bateador antes de que el corredor anotara, la carrera no cuenta. Tambien puede cambiar si la bola entro a area fuera de juego o si la liga tiene regla local.`;
  }

  if (t.includes("foul") && (t.includes("dos strikes") || t.includes("2 strikes")) && t.includes("slow")) {
    return `DECISION PROBABLE
En slow pitch, el bateador normalmente es out si batea foul con dos strikes.

DISCIPLINA
Slow Pitch.

CRITERIO APLICABLE
Segun el criterio general de slow pitch, el foul despues del segundo strike se cuenta como tercer strike.

EXPLICACION
A diferencia del beisbol, en muchas reglas de slow pitch el bateador no puede seguir vivo con fouls ilimitados despues de dos strikes.

REANUDACION
Se marca out al bateador, bola muerta y entra el siguiente bateador.

ADVERTENCIA
Confirma si tu liga usa conteo inicial especial, foul extra o regla local.`;
  }

  if (t.includes("infield fly") || t.includes("elevado al cuadro")) {
    return `DECISION PROBABLE
Puede aplicar infield fly si hay menos de dos outs, corredores en primera y segunda o bases llenas, y el batazo es elevado atrapable con esfuerzo ordinario por un jugador de cuadro.

DISCIPLINA
Beisbol / Softbol, segun reglamento aplicable.

CRITERIO APLICABLE
El bateador es out para proteger a los corredores de una doble jugada intencional.

EXPLICACION
La bola sigue viva. Los corredores pueden avanzar a riesgo. Si el elevado es foul y no se atrapa, normalmente no hay infield fly efectivo.

REANUDACION
Se declara out al bateador. Los corredores quedan donde termine la jugada, salvo apelacion o out adicional.

ADVERTENCIA
Depende del juicio del ampayer sobre esfuerzo ordinario.`;
  }

  return `Para ayudarte bien, necesito ordenar la jugada.

Mandame estos datos:

1. Modalidad: beisbol, fast pitch o slow pitch
2. Tu rol: ampayer, coach, jugador, anotador u organizador
3. Outs
4. Corredores en base
5. Conteo del bateador
6. Que paso exactamente
7. Que marco el ampayer
8. Si hay regla local

Si quieres, escribe solo asi:

Slow pitch, 1 out, corredor en tercera, conteo 1-1. El bateador conecta elevado de foul, lo atrapa el catcher y el corredor sale a home. Cuenta?`;
}

bot.start((ctx) => ctx.reply(startMessage, mainMenu));

bot.hears("Slow Pitch", (ctx) => ctx.reply(templates.slowpitch, mainMenu));
bot.hears("Fast Pitch", (ctx) => ctx.reply(templates.fastpitch, mainMenu));
bot.hears("Beisbol", (ctx) => ctx.reply(templates.beisbol, mainMenu));
bot.hears("Jugada", (ctx) => ctx.reply(templates.jugada, mainMenu));
bot.hears("Regla", (ctx) => ctx.reply(templates.regla, mainMenu));
bot.hears("Mecanica", (ctx) => ctx.reply(templates.mecanica, mainMenu));
bot.hears("Lineup", (ctx) => ctx.reply(templates.lineup, mainMenu));
bot.hears("Protesta", (ctx) => ctx.reply(templates.protesta, mainMenu));
bot.hears("Ayuda", (ctx) => ctx.reply(startMessage, mainMenu));

bot.on("text", (ctx) => {
  const text = ctx.message.text;
  if (text === "/start") return;
  ctx.reply(analyzeText(text), mainMenu);
});

bot.launch();

app.get("/", (req, res) => {
  res.send("Coach Softbol Beisbol bot activo sin IA");
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Servidor activo en puerto ${port}`);
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

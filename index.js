const express = require('express');
const { Telegraf, Markup } = require('telegraf');

const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const app = express();
const port = process.env.PORT || 10000;

if (!telegramToken) throw new Error('Falta TELEGRAM_BOT_TOKEN');

const bot = new Telegraf(telegramToken);

const mainMenu = Markup.keyboard([
['Slow Pitch', 'Fast Pitch'],
['Beisbol', 'Jugada'],
['Regla', 'Mecanica'],
['Lineup', 'Protesta'],
['Bola viva/muerta', 'Ayuda']
]).resize();

const startMessage = `Bienvenido a Coach Softbol Beisbol.

Te ayudo con dudas de beisbol, softbol fast pitch y slow pitch para jugadores, coaches, ampayers, anotadores y ligas.

Puedes escribir una jugada natural, por ejemplo:

Slow pitch, 1 out, corredor en tercera. El bateador conecta elevado de foul y lo atrapa el catcher. El corredor pisa tercera y sale a home. Cuenta la carrera?

Trabajo con plantillas y criterios generales. Si tu liga tiene regla local, esa regla puede cambiar la decision.`;

const templates = {
slowpitch: `SLOW PITCH

Temas que puedo revisar:

Foul con 2 strikes
Elevado de foul atrapado
Bola viva / bola muerta
Corredores que salen antes
Home run limit
Lineup y sustituciones
Apelaciones
Interferencia y obstruccion
Jugadas en home

Para una decision mas exacta manda: outs, corredores, conteo, que paso y que marco el ampayer.`,

fastpitch: `FAST PITCH

Temas que puedo revisar:

Salida anticipada de corredoras
Lanzamiento ilegal
Robo de base
Toque de bola
Bola viva / bola muerta
Interferencia y obstruccion
Lineup, DP/Flex y sustituciones

Dato clave: en fast pitch muchas jugadas dependen del momento exacto en que la bola sale de la mano de la pitcher.`,

beisbol: `BEISBOL

Temas que puedo revisar:

Balk
Infield fly
Interferencia
Obstruccion
Apelaciones
Bateador fuera de turno
Lineup y sustituciones
Bola viva / bola muerta

Para jugadas de pitcher, dime si estaba en windup o set, corredores en base y que movimiento hizo.`,

jugada: `FORMATO IDEAL PARA ANALIZAR UNA JUGADA

Mandame:

Modalidad: beisbol, fast pitch o slow pitch
Rol: ampayer, coach, jugador, anotador u organizador
Outs
Corredores en base
Conteo del bateador
Que paso exactamente
Que marco el ampayer
Que reclama cada equipo
Si hay regla local

Si no mandas todo, intentare responder con criterio general.`,

regla: `DUDA DE REGLA

Puedes preguntar directo, por ejemplo:

En slow pitch, foul con dos strikes es out?
Cuando aplica infield fly?
Que diferencia hay entre interferencia y obstruccion?
Como se apela que un corredor no piso base?
Cuando una carrera no cuenta?

Sin reglamento oficial a la vista, respondere con criterio general y no inventare numeros de regla.`,

mecanica: `MECANICA PARA AMPAYER

Puedo ayudarte con:

Posicion inicial
Coberturas
Rotaciones
Senales
Comunicacion entre ampayers
Prioridades en bola bateada
Apelaciones
Jugadas en home

Mandame numero de ampayers, modalidad, corredores en base y tipo de batazo.`,

lineup: `LINEUP Y SUSTITUCIONES

Puedo revisar:

Orden al bat
Reingreso
Sustituciones
Jugador ilegal
Bateador fuera de turno
DP/Flex en fast pitch
EP/EH si tu liga lo usa

Mandame quien debia batear, quien bateo, que paso y cuando reclamaron.`,

protesta: `APELACION O PROTESTA

Criterio general: una protesta normalmente procede por mala aplicacion de regla, no por juicio del ampayer.

Juicio del ampayer:
Safe/out
Bola/strike
Fair/foul de apreciacion
Atrapada/no atrapada

Posible mala aplicacion de regla:
Regla de sustitucion
Bateador fuera de turno
Carrera que cuenta o no cuenta
Aplicacion incorrecta de bases
Regla local mal usada

Para revisar, manda entrada, outs, jugada, decision y momento de la protesta.`,

deadball: `BOLA VIVA / BOLA MUERTA

Bola viva:
La jugada sigue. Corredores pueden avanzar a riesgo y la defensa puede hacer outs.

Bola muerta:
La accion se detiene. Los corredores regresan o avanzan solo si la regla concede bases.

Ejemplos comunes de bola muerta:
Foul no atrapado
Interferencia ofensiva
Pelota fuera de juego
Tiempo concedido por el ampayer
Pelotazo al bateador, segun modalidad

Dime que paso con la bola y donde termino para darte mejor criterio.`
};

function clean(text) {
return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function hasAny(text, words) {
return words.some((word) => text.includes(word));
}

function responseBlock(decision, disciplina, criterio, explicacion, reanudacion, advertencia) {
return `DECISION DIRECTA
${decision}

DISCIPLINA
${disciplina}

CRITERIO APLICABLE
${criterio}

EXPLICACION
${explicacion}

REANUDACION
${reanudacion}

ADVERTENCIA
${advertencia}`;
}

function analyzeText(text) {
const t = clean(text);

const isSlow = hasAny(t, ['slow', 'slow pitch', 'slowpitch', 'bola lenta']);
const isFast = hasAny(t, ['fast', 'fast pitch', 'fastpitch', 'bola rapida']);
const isBaseball = hasAny(t, ['beisbol', 'baseball']);

const foul = hasAny(t, ['foul', 'faul']);
const catchBall = hasAny(t, ['atrap', 'agarro', 'captur', 'cacheo', 'fildeo de aire']);
const catcher = hasAny(t, ['catcher', 'receptor']);
const third = hasAny(t, ['tercera', '3ra', '3a', 'tercer']);
const home = hasAny(t, ['home', 'jon', 'plato', 'anota', 'carrera']);
const twoStrikes = hasAny(t, ['dos strikes', '2 strikes', '2 strike', 'segundo strike']);

const infield = hasAny(t, ['infield fly', 'elevado al cuadro', 'fly al cuadro']);
const interference = hasAny(t, ['interferencia', 'interfiere', 'estorba', 'obstruye al fildeador']);
const obstruction = hasAny(t, ['obstruccion', 'bloquea', 'bloqueo', 'taponea', 'estorba al corredor']);
const appeal = hasAny(t, ['apelacion', 'apelar', 'no piso', 'piso mal', 'retoco', 'salio antes']);
const lineup = hasAny(t, ['lineup', 'orden al bat', 'bateador fuera de turno', 'fuera de turno', 'sustitucion', 'reingreso']);
const balk = hasAny(t, ['balk', 'engano', 'engaño']);
const illegalPitch = hasAny(t, ['lanzamiento ilegal', 'pitch ilegal', 'ilegal pitch']);
const runnerEarly = hasAny(t, ['salio antes', 'sale antes', 'despegue', 'despego', 'abandono la base']);
const deadLive = hasAny(t, ['bola muerta', 'bola viva', 'muerta', 'viva']);
const hitByPitch = hasAny(t, ['pelotazo', 'hit by pitch', 'golpeado', 'le pego la bola']);
const fairFoul = hasAny(t, ['fair', 'buena', 'mala', 'linea de foul']);
const tagUp = hasAny(t, ['pisa y corre', 'retoca', 'retoco', 'sale despues', 'sacrificio']);
const homeRunLimit = hasAny(t, ['home run limit', 'limite de jonrones', 'jonron de mas', 'cuadrangular de mas']);

if (foul && catchBall && catcher && third && home) {
return responseBlock(
'La carrera puede contar si el corredor retoco tercera correctamente despues de la atrapada y anoto antes de un tercer out valido.',
'Criterio general para beisbol, fast pitch y slow pitch.',
'Un elevado de foul atrapado legalmente pone out al bateador, pero la bola normalmente sigue viva. Los corredores pueden avanzar despues de retocar.',
'Si el catcher atrapa legalmente el foul fly, el bateador es out. El corredor de tercera puede pisar o retocar tercera y avanzar a home. Si no salio antes y no hay apelacion ganada, la carrera cuenta.',
'Se registra el out al bateador. La carrera cuenta si anoto legalmente antes del tercer out.',
'Si fue tercer out antes de que anotara el corredor, la carrera no cuenta. Tambien puede cambiar si la bola salio fuera de juego o si la liga tiene regla local.'
);
}

if (foul && twoStrikes && isSlow) {
return responseBlock(
'En slow pitch, normalmente el bateador es out si conecta foul con dos strikes.',
'Slow Pitch.',
'Segun el criterio general de slow pitch, el foul despues del segundo strike se cuenta como tercer strike.',
'En muchas reglas de slow pitch no hay fouls ilimitados con dos strikes como en beisbol.',
'Out al bateador, bola muerta y entra el siguiente bateador.',
'Algunas ligas permiten un foul extra o usan conteo inicial especial. Hay que revisar regla local.'
);
}

if (infield) {
return responseBlock(
'Puede aplicar infield fly si hay menos de dos outs, corredores en primera y segunda o bases llenas, y el elevado es atrapable con esfuerzo ordinario.',
'Beisbol / Softbol, segun modalidad.',
'El bateador es declarado out para evitar que la defensa deje caer la bola intencionalmente y haga doble play facil.',
'La bola sigue viva. Los corredores pueden avanzar a su propio riesgo. Si el elevado cae de foul sin ser atrapado, normalmente no se aplica el out por infield fly.',
'Out al bateador. Los corredores quedan segun avance la jugada.',
'Es decision de juicio del ampayer: debe valorar altura, ubicacion y esfuerzo ordinario.'
);
}

if (interference) {
return responseBlock(
'Puede haber interferencia si un jugador ofensivo estorba, impide o confunde a la defensa que intenta hacer una jugada.',
'Beisbol, fast pitch o slow pitch.',
'La ofensiva no puede interferir con un fildeador que tiene derecho a jugar una bola bateada o realizar una jugada.',
'Si el contacto o estorbo afecta la oportunidad defensiva, normalmente se declara out al corredor o bateador-corredor involucrado y la bola queda muerta.',
'Depende del tipo de interferencia. Por lo general se regresa a los corredores a la ultima base legal al momento de la interferencia.',
'No todo contacto es interferencia. El ampayer debe juzgar si realmente afecto la jugada.'
);
}

if (obstruction) {
return responseBlock(
'Puede haber obstruccion si un defensivo sin posesion de la bola y sin derecho a bloquear estorba el avance del corredor.',
'Beisbol, fast pitch o slow pitch.',
'La defensa no puede impedir el avance del corredor si no tiene la bola ni esta haciendo una jugada legal sobre el corredor.',
'El ampayer debe proteger al corredor hasta la base que, a su juicio, hubiera alcanzado sin la obstruccion.',
'Puede ser bola viva demorada o bola muerta, segun modalidad y tipo de jugada.',
'La decision cambia si el defensivo ya tenia la bola, estaba recibiendo tiro o solo bloqueo sin jugada.'
);
}

if (appeal || tagUp) {
return responseBlock(
'Puede proceder una apelacion si un corredor no piso base, salio antes en elevado atrapado o no retoco correctamente.',
'Beisbol, fast pitch o slow pitch.',
'La defensa debe apelar correctamente para que el ampayer declare out por omision de base o salida anticipada.',
'El ampayer no siempre canta automaticamente que el corredor salio antes o no piso base. La defensa debe hacer la apelacion en tiempo y forma.',
'Si la apelacion es valida, se declara out al corredor apelado. Si es tercer out, puede afectar si cuenta o no una carrera.',
'La forma exacta de apelar puede cambiar por liga: verbal, tocando base, con bola viva o bola muerta.'
);
}

if (lineup) {
return responseBlock(
'La decision depende de si el problema es bateador fuera de turno, sustitucion ilegal, reingreso o cambio no reportado.',
'Beisbol, fast pitch o slow pitch.',
'El orden al bat y las sustituciones deben seguir la alineacion oficial y las reglas de reingreso o jugadores extras de la liga.',
'En bateador fuera de turno importa mucho cuando se apela: durante el turno, despues de batear o despues de un lanzamiento al siguiente bateador.',
'Puede corregirse el bateador, declarar out al bateador correcto, anular avances o mantener la jugada, segun el momento de la apelacion.',
'Manda el orden al bat, quien debia batear, quien bateo y cuando reclamaron para darte mejor criterio.'
);
}

if (balk) {
return responseBlock(
'Puede ser balk si el pitcher hizo un movimiento ilegal con corredores en base.',
'Beisbol.',
'El pitcher no puede enganar ilegalmente a los corredores ni iniciar movimientos que no complete conforme a regla.',
'Ejemplos comunes: iniciar movimiento al plato y no lanzar, tirar a base sin paso legal, simular tiro ilegal o hacer pausa irregular.',
'Normalmente se concede una base a cada corredor.',
'Balk es tecnico. Describe pies, posicion del pitcher, movimiento y corredores.'
);
}

if (illegalPitch || (runnerEarly && isFast)) {
return responseBlock(
'En fast pitch puede haber lanzamiento ilegal o salida anticipada, dependiendo del momento exacto.',
'Fast Pitch.',
'La corredora normalmente debe permanecer en contacto con la base hasta que la bola salga de la mano de la pitcher.',
'Si sale antes de la liberacion del lanzamiento, puede ser out por salida anticipada. Si el problema es movimiento ilegal de la pitcher, puede sancionarse lanzamiento ilegal.',
'En salida anticipada, usualmente bola muerta y out a la corredora. En lanzamiento ilegal, la sancion depende del reglamento.',
'Necesito saber si salio cuando inicio el movimiento, cuando bajo el brazo o cuando solto la bola.'
);
}

if (deadLive) return templates.deadball;

if (hitByPitch) {
return responseBlock(
'Puede concederse primera base, pero depende de modalidad, zona del lanzamiento y si el bateador intento evitar el contacto.',
'Beisbol, fast pitch o slow pitch.',
'Un bateador golpeado por un lanzamiento puede tener derecho a primera base si cumple las condiciones de la regla aplicable.',
'No siempre todo pelotazo da base. Puede cambiar si la bola esta en zona de strike, si pega primero al bat o si el bateador se mueve hacia el lanzamiento.',
'Bola muerta y se coloca al bateador-corredor en primera si procede.',
'En slow pitch algunas ligas tienen reglas locales especiales sobre pelotazo.'
);
}

if (fairFoul) {
return responseBlock(
'Fair o foul depende de donde esta o donde pasa la pelota conforme a las lineas y bases.',
'Beisbol, fast pitch o slow pitch.',
'La decision puede depender de si la bola toca primero terreno fair/foul, si pasa primera o tercera, o si toca jugador, base o cerca.',
'Muchas jugadas fair/foul son de juicio del ampayer y no se corrigen por protesta, salvo mala aplicacion de regla.',
'Si es foul no atrapado, bola muerta. Si es fair, bola viva.',
'Describe donde pico la bola, si paso primera/tercera y donde fue tocada.'
);
}

if (homeRunLimit) {
return responseBlock(
'El resultado depende totalmente de la regla local de limite de home runs.',
'Principalmente Slow Pitch.',
'Muchas ligas de slow pitch usan limite de jonrones por equipo. El jonron excedente puede ser out, sencillo, inning ending out u otra sancion local.',
'No hay una sola respuesta universal porque esto casi siempre es regla de liga o torneo.',
'Se aplica lo que diga la convocatoria o reglamento local.',
'Necesito saber el limite de jonrones y la sancion escrita en tu liga.'
);
}

if (isSlow) return templates.slowpitch;
if (isFast) return templates.fastpitch;
if (isBaseball) return templates.beisbol;

return `Te puedo ayudar. Por ahora funciono con plantillas abiertas, asi que necesito detectar el tema principal.

Puedes preguntarme asi:

En slow pitch, foul con dos strikes, es out?
Elevado de foul atrapado por catcher, corredor de tercera pisa y anota, cuenta?
Que es infield fly?
Cuando hay interferencia?
Cuando hay obstruccion?
Como se apela si un corredor no piso base?
Que pasa con bateador fuera de turno?
En fast pitch, corredora sale antes de que la pitcher suelte la bola, es out?
Que pasa si hay balk?
Cuando la bola queda muerta?

Si tu jugada es especial, mandamela con modalidad, outs, corredores, conteo y que marco el ampayer.`;
}

bot.start((ctx) => ctx.reply(startMessage, mainMenu));

bot.hears('Slow Pitch', (ctx) => ctx.reply(templates.slowpitch, mainMenu));
bot.hears('Fast Pitch', (ctx) => ctx.reply(templates.fastpitch, mainMenu));
bot.hears('Beisbol', (ctx) => ctx.reply(templates.beisbol, mainMenu));
bot.hears('Jugada', (ctx) => ctx.reply(templates.jugada, mainMenu));
bot.hears('Regla', (ctx) => ctx.reply(templates.regla, mainMenu));
bot.hears('Mecanica', (ctx) => ctx.reply(templates.mecanica, mainMenu));
bot.hears('Lineup', (ctx) => ctx.reply(templates.lineup, mainMenu));
bot.hears('Protesta', (ctx) => ctx.reply(templates.protesta, mainMenu));
bot.hears('Bola viva/muerta', (ctx) => ctx.reply(templates.deadball, mainMenu));
bot.hears('Ayuda', (ctx) => ctx.reply(startMessage, mainMenu));

bot.on('text', (ctx) => {
const text = ctx.message.text;
if (text === '/start') return;
ctx.reply(analyzeText(text), mainMenu);
});

bot.launch();

app.get('/', (req, res) => {
res.send('Coach Softbol Beisbol bot activo sin IA');
});

app.listen(port, '0.0.0.0', () => {
console.log(Servidor activo en puerto ${port});
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

/* ===========================================================================
   Time — toda la lógica temporal del horario (qué toca ahora, qué viene)
   =========================================================================== */
(function (global) {
  'use strict';

  var HX = global.HX || (global.HX = {});
  var D = HX.data;

  var offset = 0; // desplazamiento de depuración en ms

  function now() { return new Date(Date.now() + offset); }

  function setOffset(ms) { offset = ms || 0; }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function minutesOf(date) { return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60; }

  function iso(date) {
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  }

  function parseISO(s) {
    if (!s) return null;
    var p = String(s).slice(0, 10).split('-');
    if (p.length !== 3) return null;
    var d = new Date(+p[0], (+p[1]) - 1, +p[2]);
    return isNaN(d.getTime()) ? null : d;
  }

  function startOfDay(date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate()); }

  function addDays(date, n) {
    var d = new Date(date.getTime());
    d.setDate(d.getDate() + n);
    return d;
  }

  function dayKeyOf(date) {
    var d = D.dayByIndex(date.getDay());
    return d ? d.key : null;
  }

  function isHoliday(date) {
    var t = startOfDay(date).getTime();
    var list = D.CALENDAR.holidays || [];
    for (var i = 0; i < list.length; i++) {
      var from = parseISO(list[i].from), to = parseISO(list[i].to || list[i].from);
      if (from && to && t >= from.getTime() && t <= to.getTime()) return list[i];
    }
    return null;
  }

  function isSchoolDay(date) {
    return !!dayKeyOf(date) && !isHoliday(date);
  }

  /* Sesión = un tramo lectivo concreto de un día concreto. */
  function sessionsOf(date) {
    var key = dayKeyOf(date);
    if (!key || isHoliday(date)) return [];
    var base = startOfDay(date);
    return D.PERIODS.map(function (p) {
      var id = D.TIMETABLE[key][p.i];
      return {
        period: p,
        dayKey: key,
        subject: p.kind === 'break' ? null : id,
        isBreak: p.kind === 'break',
        start: new Date(base.getTime() + p.startMin * 60000),
        end: new Date(base.getTime() + p.endMin * 60000)
      };
    }).filter(function (s) { return s.isBreak || s.subject; });
  }

  /* Une tramos consecutivos de la misma materia en un único bloque,
     que es como se vive la clase (SERRE de 8:30 a 10:30 es una sola). */
  function mergedSessionsOf(date) {
    var list = sessionsOf(date), out = [];
    list.forEach(function (s) {
      var prev = out[out.length - 1];
      if (prev && !s.isBreak && !prev.isBreak && prev.subject === s.subject &&
          prev.end.getTime() === s.start.getTime()) {
        prev.end = s.end;
        prev.periods.push(s.period);
      } else {
        out.push({
          period: s.period, periods: [s.period], dayKey: s.dayKey, subject: s.subject,
          isBreak: s.isBreak, start: s.start, end: s.end
        });
      }
    });
    return out;
  }

  /* Próxima sesión lectiva a partir de `from` (busca hasta 30 días). */
  function nextSession(from) {
    var ref = from || now();
    for (var i = 0; i < 30; i++) {
      var day = addDays(ref, i);
      var list = mergedSessionsOf(day).filter(function (s) { return !s.isBreak; });
      for (var j = 0; j < list.length; j++) {
        if (list[j].start.getTime() > ref.getTime()) return list[j];
      }
    }
    return null;
  }

  /* Instantánea del momento actual. */
  function snapshot(ref) {
    var date = ref || now();
    var list = mergedSessionsOf(date);
    var t = date.getTime();
    var current = null, next = null;

    for (var i = 0; i < list.length; i++) {
      if (t >= list[i].start.getTime() && t < list[i].end.getTime()) { current = list[i]; break; }
    }
    for (var k = 0; k < list.length; k++) {
      if (list[k].start.getTime() > t) { next = list[k]; break; }
    }

    var phase;
    if (!list.length) phase = 'off';
    else if (current && current.isBreak) phase = 'break';
    else if (current) phase = 'class';
    else if (!current && next) phase = 'gap';
    else phase = 'after';

    var upcoming = next && !next.isBreak ? next : nextSession(date);
    if (next && next.isBreak) {
      // tras el recreo viene otra clase el mismo día
      var after = list.filter(function (s) { return !s.isBreak && s.start.getTime() > t; })[0];
      upcoming = after || nextSession(date);
    }

    var progress = 0, remaining = 0, elapsed = 0;
    if (current) {
      elapsed = t - current.start.getTime();
      remaining = current.end.getTime() - t;
      progress = elapsed / (current.end.getTime() - current.start.getTime());
    }

    var lessons = list.filter(function (s) { return !s.isBreak; });
    var doneLessons = lessons.filter(function (s) { return s.end.getTime() <= t; }).length;
    var dayProgress = 0;
    var dayStart = lessons.length ? lessons[0].start.getTime() : 0;
    var dayEnd = lessons.length ? lessons[lessons.length - 1].end.getTime() : 0;
    if (dayEnd > dayStart) dayProgress = Math.max(0, Math.min(1, (t - dayStart) / (dayEnd - dayStart)));

    return {
      date: date,
      dayKey: dayKeyOf(date),
      holiday: isHoliday(date),
      sessions: list,
      lessons: lessons,
      current: current,
      next: next,
      upcoming: upcoming,
      phase: phase,
      progress: progress,
      elapsed: elapsed,
      remaining: remaining,
      dayProgress: dayProgress,
      doneLessons: doneLessons,
      totalLessons: lessons.length,
      untilNext: upcoming ? upcoming.start.getTime() - t : null
    };
  }

  /* --- Formateo ---------------------------------------------------------- */
  function clock(date, withSeconds) {
    var d = date || now();
    return pad(d.getHours()) + ':' + pad(d.getMinutes()) + (withSeconds ? ':' + pad(d.getSeconds()) : '');
  }

  function countdown(ms) {
    if (ms == null) return '--:--';
    var s = Math.max(0, Math.floor(ms / 1000));
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    if (h > 0) return h + ':' + pad(m) + ':' + pad(sec);
    return pad(m) + ':' + pad(sec);
  }

  function human(ms) {
    if (ms == null) return '—';
    var s = Math.max(0, Math.floor(ms / 1000));
    var d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
    if (d > 0) return d + ' d ' + h + ' h';
    if (h > 0) return h + ' h ' + m + ' min';
    if (m > 0) return m + ' min';
    return 'menos de 1 min';
  }

  function daysUntil(dateStr, ref) {
    var target = parseISO(dateStr);
    if (!target) return null;
    var base = startOfDay(ref || now());
    return Math.round((target.getTime() - base.getTime()) / 86400000);
  }

  function longDate(date) {
    var d = date || now();
    try {
      return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    } catch (e) {
      return iso(d);
    }
  }

  function shortDate(dateStr) {
    var d = parseISO(dateStr);
    if (!d) return '—';
    try {
      return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
    } catch (e) { return dateStr; }
  }

  function nextHoliday(ref) {
    var base = startOfDay(ref || now()).getTime();
    var best = null;
    (D.CALENDAR.holidays || []).forEach(function (h) {
      var from = parseISO(h.from);
      if (from && from.getTime() >= base && (!best || from.getTime() < parseISO(best.from).getTime())) best = h;
    });
    return best;
  }

  /* Semana del lunes que contiene `date`. */
  function weekOf(date) {
    var d = startOfDay(date || now());
    var shift = (d.getDay() + 6) % 7; // 0 = lunes
    var monday = addDays(d, -shift);
    return D.DAYS.map(function (day, i) { return addDays(monday, i); });
  }

  HX.time = {
    now: now, setOffset: setOffset, pad: pad, iso: iso, parseISO: parseISO,
    startOfDay: startOfDay, addDays: addDays, minutesOf: minutesOf,
    dayKeyOf: dayKeyOf, isHoliday: isHoliday, isSchoolDay: isSchoolDay,
    sessionsOf: sessionsOf, mergedSessionsOf: mergedSessionsOf, nextSession: nextSession, snapshot: snapshot,
    clock: clock, countdown: countdown, human: human, daysUntil: daysUntil,
    longDate: longDate, shortDate: shortDate, nextHoliday: nextHoliday, weekOf: weekOf
  };
})(window);

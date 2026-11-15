(function (root) {
  var INFO = [
    0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
    0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
    0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
    0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
    0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
    0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5d0, 0x14573, 0x052d0, 0x0a9a8, 0x0e950, 0x06aa0,
    0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
    0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b5a0, 0x195a6,
    0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
    0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0,
    0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
    0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
    0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
    0x05aa0, 0x076a3, 0x096d0, 0x04bd7, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
    0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
  ];
  var TERM_INFO = [
    0, 21208, 42467, 63836, 85337, 107014, 128867, 150921, 173149, 195551, 218072, 240693,
    263343, 285989, 308563, 331033, 353350, 375494, 397447, 419210, 440795, 462224, 483532, 504758,
  ];
  var TERMS = [
    "小寒", "大寒", "立春", "雨水", "惊蛰", "春分", "清明", "谷雨",
    "立夏", "小满", "芒种", "夏至", "小暑", "大暑", "立秋", "处暑",
    "白露", "秋分", "寒露", "霜降", "立冬", "小雪", "大雪", "冬至",
  ];
  var MONTHS = ["正", "二", "三", "四", "五", "六", "七", "八", "九", "十", "冬", "腊"];
  var WEEK = ["日", "一", "二", "三", "四", "五", "六"];

  function lYearDays(y) {
    var i, sum = 348;
    for (i = 0x8000; i > 0x8; i >>= 1) sum += INFO[y - 1900] & i ? 1 : 0;
    return sum + leapDays(y);
  }
  function leapMonth(y) {
    return INFO[y - 1900] & 0xf;
  }
  function leapDays(y) {
    if (leapMonth(y)) return INFO[y - 1900] & 0x10000 ? 30 : 29;
    return 0;
  }
  function monthDays(y, m) {
    return INFO[y - 1900] & (0x10000 >> m) ? 30 : 29;
  }
  function termDate(y, n) {
    var off = new Date(31556925974.7 * (y - 1900) + TERM_INFO[n] * 60000 + Date.UTC(1900, 0, 6, 2, 5));
    return { m: off.getUTCMonth() + 1, d: off.getUTCDate() };
  }
  function solarTerm(y, m, d) {
    var i, t;
    for (i = 0; i < 24; i++) {
      t = termDate(y, i);
      if (t.m === m && t.d === d) return TERMS[i];
    }
    return "";
  }
  function toCnDay(d) {
    var nStr1 = ["日", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
    var nStr2 = ["初", "十", "廿", "卅"];
    if (d === 10) return "初十";
    if (d === 20) return "二十";
    if (d === 30) return "三十";
    return nStr2[Math.floor(d / 10)] + nStr1[d % 10];
  }
  function monthName(m, leap) {
    return (leap ? "闰" : "") + MONTHS[m - 1] + "月";
  }
  function solar2lunar(y, m, d) {
    if (y < 1900 || y > 2049) return null;
    var offset = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(1900, 0, 31)) / 86400000);
    var i, temp = 0, leap, isLeap = false, year, month, day;
    for (i = 1900; i < 2050 && offset > 0; i++) {
      temp = lYearDays(i);
      offset -= temp;
    }
    if (offset < 0) {
      offset += temp;
      i--;
    }
    year = i;
    leap = leapMonth(year);
    for (i = 1; i < 13 && offset > 0; i++) {
      if (leap > 0 && i === leap + 1 && !isLeap) {
        --i;
        isLeap = true;
        temp = leapDays(year);
      } else {
        temp = monthDays(year, i);
      }
      if (isLeap && i === leap + 1) isLeap = false;
      offset -= temp;
    }
    if (offset === 0 && leap > 0 && i === leap + 1) {
      if (isLeap) isLeap = false;
      else {
        isLeap = true;
        --i;
      }
    }
    if (offset < 0) {
      offset += temp;
      --i;
    }
    month = i;
    day = offset + 1;
    var term = solarTerm(y, m, d);
    var cnMonth = monthName(month, isLeap);
    var cnDay = toCnDay(day);
    var cell = term || (day === 1 ? cnMonth : cnDay);
    return {
      year: year,
      month: month,
      day: day,
      isLeap: isLeap,
      cnMonth: cnMonth,
      cnDay: cnDay,
      term: term,
      cell: cell,
      head: cnMonth + cnDay,
      week: WEEK[new Date(y, m - 1, d).getDay()],
    };
  }

  root.LUNAR = {
    of: solar2lunar,
    weekLong: function (isoWeekdayIndex) {
      return "星期" + WEEK[isoWeekdayIndex];
    },
  };
})(window);

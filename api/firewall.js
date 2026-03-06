let requests = {};

export function checkRateLimit(ip) {
  const now = Date.now();
  if (!requests[ip]) {
    requests[ip] = { count: 1, time: now };
    return true;
  }
  if (now - requests[ip].time < 60000) { // خلال دقيقة واحدة
    if (requests[ip].count > 20) return false; // حد أقصى 20 طلب
    requests[ip].count++;
  } else {
    requests[ip] = { count: 1, time: now };
  }
  return true;
}

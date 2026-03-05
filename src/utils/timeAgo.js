export function timeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'עכשיו';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `לפני ${minutes} דק׳`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `לפני ${hours} שעות`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'אתמול';
  if (days === 2) return 'שלשום';
  if (days < 7) return `לפני ${days} ימים`;
  return date.toLocaleDateString('he-IL');
}

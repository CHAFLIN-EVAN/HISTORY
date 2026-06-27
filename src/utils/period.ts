/**
 * 将 DynastyNode.period 字符串解析为可排序的起始年份数值。
 * 公元前为负数，公元后为正数。无法解析返回 Infinity（排在最后）。
 */
export function parsePeriodStart(period: string | undefined): number {
  if (!period) return Infinity;

  // 取第一个时间段（处理 "前753–476（西）/1453（东）" 这种复合格式）
  const first = period.split(/[/／]/)[0].trim();

  // 处理 "14–17世纪" 格式（无 "前" 前缀的世纪）
  const centuryMatch = first.match(/^(\d+)[–\-—](\d+)世纪/);
  if (centuryMatch) {
    return (parseInt(centuryMatch[1]) - 1) * 100 + 1;
  }

  // 处理 "前X世纪" 格式
  const bcCenturyMatch = first.match(/^前(\d+)世纪/);
  if (bcCenturyMatch) {
    return -(parseInt(bcCenturyMatch[1]) - 1) * 100 - 50;
  }

  // 处理 "X世纪" 格式
  const adCenturyMatch = first.match(/^(\d+)世纪/);
  if (adCenturyMatch) {
    return (parseInt(adCenturyMatch[1]) - 1) * 100 + 1;
  }

  // 移除 "约" 前缀
  let cleaned = first.replace(/^约/, '').trim();

  // 提取第一个年份段（处理 "前221–前207" / "1368–1644" / "前2686–前2181"）
  const yearMatch = cleaned.match(/^(前?\d+)/);
  if (!yearMatch) return Infinity;

  let yearStr = yearMatch[1];
  const isBC = yearStr.startsWith('前');
  if (isBC) yearStr = yearStr.slice(1);

  const num = parseInt(yearStr);
  if (isNaN(num)) return Infinity;

  return isBC ? -num : num;
}

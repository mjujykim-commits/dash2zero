/**
 * homeStats — 홈 대시보드용 성장 지표 집계(로컬).
 *
 * 레벨/실력 등급/XP(progress) + 아는 단어(mastered∪known) + 복습할 단어(오답 풀)
 * + 금주 학습(주간 그래프) 을 한 번에 모아 게이미피케이션 대시보드에 공급한다.
 */

import { getProgress, getWeeklyStudy, type VocabBand, type LevelTitle, type WeeklyStudy } from "./progress";
import { knownCount } from "./knownStore";
import { wrongCount } from "./reviewStore";
import { examWrongCount } from "./examReviewStore";

export interface HomeStats {
  level: number;
  title: LevelTitle;
  band: VocabBand;
  xpRatio: number; // 0..1 (현재 레벨 진행)
  toNext: number; // 다음 레벨까지 XP
  streak: number;
  dailyCount: number;
  dailyGoal: number;
  dailyRatio: number; // 0..1
  learned: number; // 아는 단어(한 번 이상 맞힘 ∪ 안다고 표시)
  reviewDue: number; // 복습할(틀린) 단어 수
  week: WeeklyStudy; // 금주 학습(월~일)
  bandRatio: number; // 다음 실력 등급까지 진행 0..1
}

export async function getHomeStats(): Promise<HomeStats> {
  const [p, week, known, w1, w2] = await Promise.all([
    getProgress(),
    getWeeklyStudy(),
    knownCount(),
    wrongCount(),
    examWrongCount(),
  ]);
  const learned = Math.max(p.mastered, known);
  const band = p.band;
  const bandRatio = band.next
    ? Math.min(1, (learned - band.min) / (band.next - band.min))
    : 1;
  return {
    level: p.level,
    title: p.title,
    band,
    xpRatio: p.ratio,
    toNext: p.toNext,
    streak: p.streak,
    dailyCount: p.dailyCount,
    dailyGoal: p.dailyGoal,
    dailyRatio: p.dailyRatio,
    learned,
    reviewDue: w1 + w2,
    week,
    bandRatio,
  };
}

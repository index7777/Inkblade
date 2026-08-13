// 純數值常數(無相依、不重賦值)。架構遷移 Stage 2b。
'use strict';

// 角色立繪縮放
export const HERO_VISUAL_SCALE=0.85;              // 腳下環繞與既有演出基準,不跟著立繪縮放
export const HERO_BODY_SCALE=HERO_VISUAL_SCALE*.72*1.3; // 只放大角色立繪30%,不動碰撞與腳下環繞

// 陣型 / 飛行 / 追蹤
export const FAN_PHI=0.52;        // 散鋒半錐角
export const BASE_SPEED=14;       // 速度→傷害的基準
export const MERGE_SPEED_K=0.18;  // 聚鋒:每多一把存活劍的減速係數
export const MERGE_WIDTH_K=0.14;  // 聚鋒:聚合大鋒視覺寬度隨存活數放大
export const SOLO_TURN=0.075;     // 脫隊追跡轉向上限
export const HOMING_RANGE=520;    // 引鋒感知範圍

import { StyleGuideTheme } from '../types';

export interface ThemeConfig {
  id: StyleGuideTheme;
  name: string;
  nameTh: string;
  badge: string;
  bgMain: string;
  bgCard: string;
  bgCardSubtle: string;
  bgHeader: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  borderSubtle: string;
  accent: string;
  accentHover: string;
  primaryBtnBg: string;
  primaryBtnText: string;
  secondaryBtnBg: string;
  secondaryBtnText: string;
  secondaryBtnBorder: string;
  pillActiveBg: string;
  pillActiveText: string;
  glassClass: string;
}

export const THEMES: Record<StyleGuideTheme, ThemeConfig> = {
  minimal_luxury: {
    id: 'minimal_luxury',
    name: 'Minimal Luxury (Light)',
    nameTh: 'สไตล์ 01: มินิมอล ลักชูรี่ (คลีน สว่าง)',
    badge: 'Style Guide 01',
    bgMain: 'bg-[#F7F6F2]',
    bgCard: 'bg-white',
    bgCardSubtle: 'bg-[#F2EFE9]',
    bgHeader: 'bg-white/95 text-[#1F1F1F] border-[#E6E4DD]',
    textPrimary: 'text-[#1F1F1F]',
    textSecondary: 'text-[#5A564C]',
    textMuted: 'text-[#8A8578]',
    borderSubtle: 'border-[#E6E4DD]',
    accent: 'bg-[#889A7B] text-white',
    accentHover: 'hover:bg-[#77886A]',
    primaryBtnBg: 'bg-[#1F1F1F] hover:bg-[#333333]',
    primaryBtnText: 'text-white',
    secondaryBtnBg: 'bg-[#F7F6F2] hover:bg-[#EFECE3]',
    secondaryBtnText: 'text-[#1F1F1F]',
    secondaryBtnBorder: 'border border-[#E6E4DD]',
    pillActiveBg: 'bg-[#1F1F1F] text-white shadow-sm',
    pillActiveText: 'text-[#1F1F1F]',
    glassClass: 'bg-white/80 backdrop-blur-md border border-[#E6E4DD]',
  },
  modern_glass: {
    id: 'modern_glass',
    name: 'Modern Glass (Dark)',
    nameTh: 'สไตล์ 02: โมเดิร์น กลาส (ดาร์ก มู้ดหรู)',
    badge: 'Style Guide 02',
    bgMain: 'bg-[#0F1114]',
    bgCard: 'bg-[#181C1E]',
    bgCardSubtle: 'bg-[#22272A]',
    bgHeader: 'bg-[#121518]/95 text-[#E8F6EF] border-[#2A2F31]',
    textPrimary: 'text-[#E8F6EF]',
    textSecondary: 'text-[#A3B8AD]',
    textMuted: 'text-[#6F8077]',
    borderSubtle: 'border-[#2A2F31]',
    accent: 'bg-[#4B7A6B] text-white',
    accentHover: 'hover:bg-[#3C6457]',
    primaryBtnBg: 'bg-[#4B7A6B] hover:bg-[#3C6457]',
    primaryBtnText: 'text-white',
    secondaryBtnBg: 'bg-[#1F2528] hover:bg-[#283034]',
    secondaryBtnText: 'text-[#E8F6EF]',
    secondaryBtnBorder: 'border border-[#2F373B]',
    pillActiveBg: 'bg-[#4B7A6B] text-white shadow-sm',
    pillActiveText: 'text-[#A7D9C2]',
    glassClass: 'bg-[#181C1E]/80 backdrop-blur-md border border-[#2A2F31]',
  },
  soft_organic: {
    id: 'soft_organic',
    name: 'Soft Organic (Warm)',
    nameTh: 'สไตล์ 03: ซอฟต์ ออร์แกนิก (เอิร์ธโทน อบอุ่น)',
    badge: 'Style Guide 03',
    bgMain: 'bg-[#F7F5EF]',
    bgCard: 'bg-white',
    bgCardSubtle: 'bg-[#EFECE1]',
    bgHeader: 'bg-white/95 text-[#333333] border-[#E8DCC6]',
    textPrimary: 'text-[#333333]',
    textSecondary: 'text-[#6B6357]',
    textMuted: 'text-[#968C7E]',
    borderSubtle: 'border-[#E8DCC6]',
    accent: 'bg-[#D7886E] text-white',
    accentHover: 'hover:bg-[#C2745B]',
    primaryBtnBg: 'bg-[#333333] hover:bg-[#444444]',
    primaryBtnText: 'text-white',
    secondaryBtnBg: 'bg-[#F7F5EF] hover:bg-[#EEE9DF]',
    secondaryBtnText: 'text-[#333333]',
    secondaryBtnBorder: 'border border-[#E8DCC6]',
    pillActiveBg: 'bg-[#D7886E] text-white shadow-sm',
    pillActiveText: 'text-[#D7886E]',
    glassClass: 'bg-white/85 backdrop-blur-md border border-[#E8DCC6]',
  },
};

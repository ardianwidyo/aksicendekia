export type GradeLevel = 'tk' | 'sd' | 'smp' | 'sma';

export interface GradeLevelMeta {
  id: GradeLevel;
  nameKey: string;
  subtitleKey: string;
  iconName: string;
}

export const GRADE_LEVELS: Record<GradeLevel, GradeLevelMeta> = {
  tk: {
    id: 'tk',
    nameKey: 'themes.tk.name',
    subtitleKey: 'themes.tk.subtitle',
    iconName: 'Baby',
  },
  sd: {
    id: 'sd',
    nameKey: 'themes.sd.name',
    subtitleKey: 'themes.sd.subtitle',
    iconName: 'Sparkles',
  },
  smp: {
    id: 'smp',
    nameKey: 'themes.smp.name',
    subtitleKey: 'themes.smp.subtitle',
    iconName: 'Compass',
  },
  sma: {
    id: 'sma',
    nameKey: 'themes.sma.name',
    subtitleKey: 'themes.sma.subtitle',
    iconName: 'Atom',
  },
};

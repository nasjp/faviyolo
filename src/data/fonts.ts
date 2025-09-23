export type FontOption = {
  id: string;
  name: string;
  cssHref: string;
  fontFamily: string;
  sample?: string;
};

export function toFontStack(fontFamily: string) {
  if (!fontFamily) {
    return undefined;
  }
  return fontFamily.includes(" ")
    ? `'${fontFamily}', sans-serif`
    : `${fontFamily}, sans-serif`;
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: "orbitron",
    name: "Orbitron",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700&display=swap",
    fontFamily: "Orbitron",
    sample: "F",
  },
  {
    id: "inconsolata",
    name: "Inconsolata",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Inconsolata:wght@400;500;700&display=swap",
    fontFamily: "Inconsolata",
    sample: "F",
  },
  {
    id: "noto-sans-jp",
    name: "Noto Sans JP",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap",
    fontFamily: "Noto Sans JP",
    sample: "字",
  },
  {
    id: "jetbrains-mono",
    name: "JetBrains Mono",
    cssHref:
      "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap",
    fontFamily: "JetBrains Mono",
    sample: "A",
  },
  {
    id: "inter",
    name: "Inter",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap",
    fontFamily: "Inter",
    sample: "Aa",
  },
  {
    id: "playfair-display",
    name: "Playfair Display",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap",
    fontFamily: "Playfair Display",
    sample: "P",
  },
  {
    id: "manrope",
    name: "Manrope",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&display=swap",
    fontFamily: "Manrope",
    sample: "M",
  },
  {
    id: "dm-serif-display",
    name: "DM Serif Display",
    cssHref:
      "https://fonts.googleapis.com/css2?family=DM+Serif+Display&display=swap",
    fontFamily: "DM Serif Display",
    sample: "D",
  },
  {
    id: "lato",
    name: "Lato",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap",
    fontFamily: "Lato",
    sample: "L",
  },
  {
    id: "roboto",
    name: "Roboto",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap",
    fontFamily: "Roboto",
    sample: "R",
  },
];

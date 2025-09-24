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
  // Sans-serif
  {
    id: "inter",
    name: "Inter",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap",
    fontFamily: "Inter",
    sample: "Aa",
  },
  {
    id: "manrope",
    name: "Manrope",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&display=swap",
    fontFamily: "Manrope",
    sample: "Aa",
  },
  {
    id: "lato",
    name: "Lato",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap",
    fontFamily: "Lato",
    sample: "Aa",
  },
  {
    id: "roboto",
    name: "Roboto",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap",
    fontFamily: "Roboto",
    sample: "Aa",
  },
  {
    id: "open-sans",
    name: "Open Sans",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap",
    fontFamily: "Open Sans",
    sample: "Aa",
  },
  {
    id: "nunito",
    name: "Nunito",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap",
    fontFamily: "Nunito",
    sample: "Aa",
  },
  {
    id: "montserrat",
    name: "Montserrat",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap",
    fontFamily: "Montserrat",
    sample: "Aa",
  },
  {
    id: "poppins",
    name: "Poppins",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap",
    fontFamily: "Poppins",
    sample: "Aa",
  },
  {
    id: "raleway",
    name: "Raleway",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700&display=swap",
    fontFamily: "Raleway",
    sample: "Aa",
  },
  {
    id: "work-sans",
    name: "Work Sans",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;600;700&display=swap",
    fontFamily: "Work Sans",
    sample: "Aa",
  },
  {
    id: "figtree",
    name: "Figtree",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;700&display=swap",
    fontFamily: "Figtree",
    sample: "Aa",
  },
  {
    id: "lexend",
    name: "Lexend",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;700&display=swap",
    fontFamily: "Lexend",
    sample: "Aa",
  },
  {
    id: "mulish",
    name: "Mulish",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Mulish:wght@400;600;700&display=swap",
    fontFamily: "Mulish",
    sample: "Aa",
  },
  {
    id: "rubik",
    name: "Rubik",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;700&display=swap",
    fontFamily: "Rubik",
    sample: "Aa",
  },
  {
    id: "space-grotesk",
    name: "Space Grotesk",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap",
    fontFamily: "Space Grotesk",
    sample: "Aa",
  },
  {
    id: "source-sans-3",
    name: "Source Sans 3",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&display=swap",
    fontFamily: "Source Sans 3",
    sample: "Aa",
  },
  {
    id: "fira-sans",
    name: "Fira Sans",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Fira+Sans:wght@400;500;700&display=swap",
    fontFamily: "Fira Sans",
    sample: "Aa",
  },
  {
    id: "ubuntu",
    name: "Ubuntu",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;500;700&display=swap",
    fontFamily: "Ubuntu",
    sample: "Aa",
  },
  {
    id: "mukta",
    name: "Mukta",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Mukta:wght@400;600;700&display=swap",
    fontFamily: "Mukta",
    sample: "Aa",
  },
  {
    id: "prompt",
    name: "Prompt",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Prompt:wght@400;600;700&display=swap",
    fontFamily: "Prompt",
    sample: "Aa",
  },
  {
    id: "ibm-plex-sans",
    name: "IBM Plex Sans",
    cssHref:
      "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;700&display=swap",
    fontFamily: "IBM Plex Sans",
    sample: "Aa",
  },
  {
    id: "noto-sans",
    name: "Noto Sans",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700&display=swap",
    fontFamily: "Noto Sans",
    sample: "Aa",
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
    id: "zen-kaku-gothic-new",
    name: "Zen Kaku Gothic New",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap",
    fontFamily: "Zen Kaku Gothic New",
    sample: "字",
  },
  {
    id: "m-plus-rounded-1c",
    name: "M PLUS Rounded 1c",
    cssHref:
      "https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;500;700&display=swap",
    fontFamily: "M PLUS Rounded 1c",
    sample: "ま",
  },
  {
    id: "kosugi-maru",
    name: "Kosugi Maru",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Kosugi+Maru&display=swap",
    fontFamily: "Kosugi Maru",
    sample: "あ",
  },
  // Serif
  {
    id: "playfair-display",
    name: "Playfair Display",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap",
    fontFamily: "Playfair Display",
    sample: "Aa",
  },
  {
    id: "dm-serif-display",
    name: "DM Serif Display",
    cssHref:
      "https://fonts.googleapis.com/css2?family=DM+Serif+Display&display=swap",
    fontFamily: "DM Serif Display",
    sample: "Aa",
  },
  {
    id: "merriweather",
    name: "Merriweather",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&display=swap",
    fontFamily: "Merriweather",
    sample: "Aa",
  },
  {
    id: "lora",
    name: "Lora",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&display=swap",
    fontFamily: "Lora",
    sample: "Aa",
  },
  {
    id: "cormorant-garamond",
    name: "Cormorant Garamond",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;700&display=swap",
    fontFamily: "Cormorant Garamond",
    sample: "Aa",
  },
  {
    id: "bitter",
    name: "Bitter",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Bitter:wght@400;600;700&display=swap",
    fontFamily: "Bitter",
    sample: "Aa",
  },
  {
    id: "source-serif-4",
    name: "Source Serif 4",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;600;700&display=swap",
    fontFamily: "Source Serif 4",
    sample: "Aa",
  },
  {
    id: "ibm-plex-serif",
    name: "IBM Plex Serif",
    cssHref:
      "https://fonts.googleapis.com/css2?family=IBM+Plex+Serif:wght@400;500;700&display=swap",
    fontFamily: "IBM Plex Serif",
    sample: "Aa",
  },
  {
    id: "noto-serif-jp",
    name: "Noto Serif JP",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;600;700&display=swap",
    fontFamily: "Noto Serif JP",
    sample: "文",
  },
  {
    id: "shippori-mincho",
    name: "Shippori Mincho",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;600;700&display=swap",
    fontFamily: "Shippori Mincho",
    sample: "富",
  },
  // Monospace
  {
    id: "jetbrains-mono",
    name: "JetBrains Mono",
    cssHref:
      "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap",
    fontFamily: "JetBrains Mono",
    sample: "A",
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
    id: "fira-code",
    name: "Fira Code",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;700&display=swap",
    fontFamily: "Fira Code",
    sample: "<>",
  },
  {
    id: "source-code-pro",
    name: "Source Code Pro",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;500;700&display=swap",
    fontFamily: "Source Code Pro",
    sample: "{}",
  },
  {
    id: "space-mono",
    name: "Space Mono",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap",
    fontFamily: "Space Mono",
    sample: "[]",
  },
  {
    id: "ibm-plex-mono",
    name: "IBM Plex Mono",
    cssHref:
      "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&display=swap",
    fontFamily: "IBM Plex Mono",
    sample: "λ",
  },
  // Display & Script
  {
    id: "orbitron",
    name: "Orbitron",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700&display=swap",
    fontFamily: "Orbitron",
    sample: "F",
  },
  {
    id: "bebas-neue",
    name: "Bebas Neue",
    cssHref: "https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap",
    fontFamily: "Bebas Neue",
    sample: "BN",
  },
  {
    id: "bungee",
    name: "Bungee",
    cssHref: "https://fonts.googleapis.com/css2?family=Bungee&display=swap",
    fontFamily: "Bungee",
    sample: "B!",
  },
  {
    id: "press-start-2p",
    name: "Press Start 2P",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap",
    fontFamily: "Press Start 2P",
    sample: "8",
  },
  {
    id: "pacifico",
    name: "Pacifico",
    cssHref: "https://fonts.googleapis.com/css2?family=Pacifico&display=swap",
    fontFamily: "Pacifico",
    sample: "Hi",
  },
  {
    id: "great-vibes",
    name: "Great Vibes",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap",
    fontFamily: "Great Vibes",
    sample: "Hi",
  },
  {
    id: "lobster",
    name: "Lobster",
    cssHref: "https://fonts.googleapis.com/css2?family=Lobster&display=swap",
    fontFamily: "Lobster",
    sample: "Lo",
  },
  {
    id: "caveat",
    name: "Caveat",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap",
    fontFamily: "Caveat",
    sample: "Hi",
  },
  {
    id: "anton",
    name: "Anton",
    cssHref: "https://fonts.googleapis.com/css2?family=Anton&display=swap",
    fontFamily: "Anton",
    sample: "A",
  },
  {
    id: "oswald",
    name: "Oswald",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;700&display=swap",
    fontFamily: "Oswald",
    sample: "O",
  },
  {
    id: "teko",
    name: "Teko",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Teko:wght@400;500;700&display=swap",
    fontFamily: "Teko",
    sample: "Tk",
  },
  {
    id: "fredoka",
    name: "Fredoka",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;700&display=swap",
    fontFamily: "Fredoka",
    sample: "Fo",
  },
  {
    id: "abril-fatface",
    name: "Abril Fatface",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Abril+Fatface&display=swap",
    fontFamily: "Abril Fatface",
    sample: "Af",
  },
  {
    id: "alfa-slab-one",
    name: "Alfa Slab One",
    cssHref:
      "https://fonts.googleapis.com/css2?family=Alfa+Slab+One&display=swap",
    fontFamily: "Alfa Slab One",
    sample: "AS",
  },
];

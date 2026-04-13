export type PhraseAlignment =
  | "top-left"
  | "center-left"
  | "bottom-left"
  | "top-center"
  | "bottom-center";

export type WelcomeSlide = {
  imageSrc: string;
  alt: string;
  phrase: string;
  phraseAlignment: PhraseAlignment;
  desktopPositionClass: string;
  mobilePositionClass: string;
  scrimOpacity: number;
  textMaxWidth?: string;
};

export const WELCOME_SLIDES: WelcomeSlide[] = [
  {
    imageSrc: "/hero/welcome-first-home.png",
    alt: "Couple holding keys and a first-home sign in front of a house",
    phrase: "Turn Savings into a Place to Call Home",
    phraseAlignment: "top-left",
    desktopPositionClass: "lg:object-[center_40%]",
    mobilePositionClass: "object-[58%_center]",
    scrimOpacity: 0.34,
    textMaxWidth: "max-w-[28rem]",
  },
  {
    imageSrc: "/hero/welcome-new-car.png",
    alt: "Man holding car keys beside a new white car with a red bow",
    phrase: "Drive Forward with Financial Confidence",
    phraseAlignment: "center-left",
    desktopPositionClass: "lg:object-[42%_center]",
    mobilePositionClass: "object-[68%_center]",
    scrimOpacity: 0.38,
    textMaxWidth: "max-w-[27rem]",
  },
  {
    imageSrc: "/hero/welcome-charity-family.png",
    alt: "Family donating money at a community charity center",
    phrase: "Give Back from a Position of Strength",
    phraseAlignment: "bottom-left",
    desktopPositionClass: "lg:object-center",
    mobilePositionClass: "object-[52%_center]",
    scrimOpacity: 0.36,
    textMaxWidth: "max-w-[30rem]",
  },
  {
    imageSrc: "/hero/welcome-campus-family.png",
    alt: "Parents smiling with their college-age son outdoors on campus",
    phrase: "Invest in Futures that Matter Most",
    phraseAlignment: "bottom-left",
    desktopPositionClass: "lg:object-center",
    mobilePositionClass: "object-[54%_center]",
    scrimOpacity: 0.37,
    textMaxWidth: "max-w-[29rem]",
  },
  {
    imageSrc: "/hero/welcome-amalfi-breakfast.png",
    alt: "Older couple enjoying breakfast with a coastal hillside view",
    phrase: "Build a Future You Can Look Forward To",
    phraseAlignment: "top-left",
    desktopPositionClass: "lg:object-[center_35%]",
    mobilePositionClass: "object-[56%_center]",
    scrimOpacity: 0.35,
    textMaxWidth: "max-w-[30rem]",
  },
  {
    imageSrc: "/hero/welcome-sandcastle-kids.png",
    alt: "Children building sandcastles on a sunny beach",
    phrase: "Stability Creates Space for Joy",
    phraseAlignment: "top-left",
    desktopPositionClass: "lg:object-center",
    mobilePositionClass: "object-[58%_center]",
    scrimOpacity: 0.33,
    textMaxWidth: "max-w-[26rem]",
  },
  {
    imageSrc: "/hero/welcome-sunset-couple.png",
    alt: "Couple relaxing on beach chairs at sunset by the ocean",
    phrase: "Enjoy Life Without Financial Uncertainty",
    phraseAlignment: "top-left",
    desktopPositionClass: "lg:object-[32%_center]",
    mobilePositionClass: "object-[36%_center]",
    scrimOpacity: 0.37,
    textMaxWidth: "max-w-[30rem]",
  },
];

export const WELCOME_SLIDE_DURATION_MS = 5000;
export const WELCOME_PHRASE_ENTER_DELAY_MS = 1000;
export const WELCOME_PHRASE_EXIT_LEAD_MS = 550;
export const WELCOME_TRANSITION_MS = 700;

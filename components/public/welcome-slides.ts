export type SlideFitMode = "cover" | "contain";

export type WelcomeSlide = {
  imageSrc: string;
  alt: string;
  phrase: string;
  desktopObjectPosition: string;
  mobileObjectPosition: string;
  fitModeDesktop: SlideFitMode;
  fitModeMobile: SlideFitMode;
  scrimStrength: number;
  phraseMaxWidth: string;
  phraseBottomOffset: string;
};

export const WELCOME_SLIDES: WelcomeSlide[] = [
  {
    imageSrc: "/hero/welcome-first-home.png",
    alt: "Couple holding keys and a first-home sign in front of a house",
    phrase: "Turn Savings into a Place to Call Home",
    desktopObjectPosition: "center 38%",
    mobileObjectPosition: "58% center",
    fitModeDesktop: "cover",
    fitModeMobile: "cover",
    scrimStrength: 0.34,
    phraseMaxWidth: "max-w-[46rem]",
    phraseBottomOffset: "pb-6 sm:pb-8 lg:pb-10",
  },
  {
    imageSrc: "/hero/welcome-new-car.png",
    alt: "Man holding car keys beside a new white car with a red bow",
    phrase: "Drive Forward with Financial Confidence",
    desktopObjectPosition: "42% 18%",
    mobileObjectPosition: "68% 20%",
    fitModeDesktop: "cover",
    fitModeMobile: "cover",
    scrimStrength: 0.38,
    phraseMaxWidth: "max-w-[44rem]",
    phraseBottomOffset: "pb-6 sm:pb-8 lg:pb-10",
  },
  {
    imageSrc: "/hero/welcome-charity-family.png",
    alt: "Family donating money at a community charity center",
    phrase: "Give Back from a Position of Strength",
    desktopObjectPosition: "center center",
    mobileObjectPosition: "52% center",
    fitModeDesktop: "cover",
    fitModeMobile: "cover",
    scrimStrength: 0.36,
    phraseMaxWidth: "max-w-[46rem]",
    phraseBottomOffset: "pb-6 sm:pb-8 lg:pb-10",
  },
  {
    imageSrc: "/hero/welcome-campus-family.png",
    alt: "Parents smiling with their college-age son outdoors on campus",
    phrase: "Invest in Futures that Matter Most",
    desktopObjectPosition: "center center",
    mobileObjectPosition: "54% center",
    fitModeDesktop: "cover",
    fitModeMobile: "cover",
    scrimStrength: 0.37,
    phraseMaxWidth: "max-w-[46rem]",
    phraseBottomOffset: "pb-6 sm:pb-8 lg:pb-10",
  },
  {
    imageSrc: "/hero/welcome-amalfi-breakfast.png",
    alt: "Older couple enjoying breakfast with a coastal hillside view",
    phrase: "Build a Future You Can Look Forward To",
    desktopObjectPosition: "center 34%",
    mobileObjectPosition: "56% center",
    fitModeDesktop: "cover",
    fitModeMobile: "cover",
    scrimStrength: 0.35,
    phraseMaxWidth: "max-w-[47rem]",
    phraseBottomOffset: "pb-6 sm:pb-8 lg:pb-10",
  },
  {
    imageSrc: "/hero/welcome-sandcastle-kids.png",
    alt: "Children building sandcastles on a sunny beach",
    phrase: "Stability Creates Space for Joy",
    desktopObjectPosition: "center center",
    mobileObjectPosition: "58% center",
    fitModeDesktop: "cover",
    fitModeMobile: "cover",
    scrimStrength: 0.33,
    phraseMaxWidth: "max-w-[42rem]",
    phraseBottomOffset: "pb-6 sm:pb-8 lg:pb-10",
  },
  {
    imageSrc: "/hero/welcome-sunset-couple.png",
    alt: "Couple relaxing on beach chairs at sunset by the ocean",
    phrase: "Enjoy Life Without Financial Uncertainty",
    desktopObjectPosition: "32% center",
    mobileObjectPosition: "36% center",
    fitModeDesktop: "cover",
    fitModeMobile: "cover",
    scrimStrength: 0.37,
    phraseMaxWidth: "max-w-[48rem]",
    phraseBottomOffset: "pb-6 sm:pb-8 lg:pb-10",
  },
  {
    imageSrc: "/hero/welcome-happy-family.png",
    alt: "Financially free happy family",
    phrase: "Organized finances create peaceful homes and happy families",
    desktopObjectPosition: "32% center",
    mobileObjectPosition: "36% center",
    fitModeDesktop: "cover",
    fitModeMobile: "cover",
    scrimStrength: 0.37,
    phraseMaxWidth: "max-w-[48rem]",
    phraseBottomOffset: "pb-6 sm:pb-8 lg:pb-10",
  },
];

export const WELCOME_SLIDE_DURATION_MS = 5000;
export const WELCOME_PHRASE_ENTER_DELAY_MS = 1000;
export const WELCOME_PHRASE_EXIT_LEAD_MS = 550;
export const WELCOME_TRANSITION_MS = 700;
